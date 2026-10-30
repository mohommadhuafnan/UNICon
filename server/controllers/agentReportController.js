import fs from 'fs';
import AgentReportSession from '../models/AgentReportSession.js';
import User from '../models/User.js';
import { persistComplaint } from './issueController.js';
import { runReportTurn } from '../services/reportAgentService.js';
import { DEPARTMENTS, PRIORITIES } from '../services/departmentRegistry.js';

const MAX_SESSION_IMAGES = 10;
const MAX_TEXT_LENGTH = 2000;
export const STALE_LOCK_MS = 10 * 60 * 1000;

const SIGNATURES = [
  (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, // jpeg
  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47, // png
  (b) => b.toString('ascii', 0, 4) === 'GIF8', // gif
  (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP', // webp
];

const isRealImage = (file) => {
  try {
    const fd = fs.openSync(file.path, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    return SIGNATURES.some((check) => check(buf));
  } catch {
    return false;
  }
};

const removeFiles = (files = []) =>
  files.forEach((f) => {
    try {
      fs.unlinkSync(f.path);
    } catch {
      // already gone
    }
  });

const publicImage = (img) => ({ id: img._id, url: img.url });
const publicMessage = (m) => ({
  id: m._id,
  role: m.role,
  text: m.text,
  images: (m.images || []).map(publicImage),
  followUp: m.followUp?.question ? { question: m.followUp.question, suggestedAnswers: m.followUp.suggestedAnswers || [] } : undefined,
  createdAt: m.createdAt,
});

const draftSummary = (draft) =>
  draft?.departmentKey && draft?.priority
    ? { department: DEPARTMENTS[draft.departmentKey]?.label, priority: draft.priority }
    : null;

export const submittedSummary = (complaint) => ({
  complaintId: complaint._id,
  ticketNumber: complaint.ticketNumber,
  title: complaint.title,
  department: complaint.routingDecision?.assignedUnit,
  priority: complaint.priority,
  imageCount: complaint.attachments?.length || 0,
  isAnonymous: complaint.isAnonymous,
});

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** For anonymous reports, make sure the student's own identifiers never reach the stored text. */
const scrubIdentity = (text, user) => {
  let out = text || '';
  const tokens = [user.name, user.registrationNumber, user.studentId, user.email].filter((t) => t && t.length >= 3);
  for (const t of tokens) out = out.replace(new RegExp(escapeRegExp(t), 'gi'), '[redacted]');
  return out;
};

/** Final backend validation. Returns an error string, or '' when the report may be filed. */
const validateReport = (r) => {
  if (!r?.title || r.title.trim().length < 5) return 'The report needs a title.';
  if (!r.description || r.description.trim().length < 20) return 'The report needs a more detailed description.';
  if (!DEPARTMENTS[r.departmentKey]) return 'No valid department was identified.';
  if (!PRIORITIES.includes(r.priority)) return 'No valid priority was identified.';
  return '';
};

export const fileReport = async ({ session, user, ip }) => {
  const r = session.draft;
  const problem = validateReport(r);
  if (problem) {
    const err = new Error(problem);
    err.statusCode = 422;
    throw err;
  }
  const dept = DEPARTMENTS[r.departmentKey];
  const anonymous = Boolean(session.isAnonymous);
  const clean = (t) => (anonymous ? scrubIdentity(t, user) : t);

  const officer = await User.findOne({ role: r.departmentKey, accountStatus: 'active' }).select('_id name role email');
  const attachments = session.messages
    .filter((m) => m.role === 'user')
    .flatMap((m) => m.images)
    .map((img) => ({ url: img.url, filename: img.filename, fileType: img.mimeType }));

  const specificLocation = clean(r.specificLocation || '');
  const routing = {
    status: 'ASSIGNED',
    assignedUnit: dept.unit,
    assignedStaff: officer ? officer._id : null,
    assignedStaffName: officer ? `${officer.name} (${officer.role})` : dept.unit,
    ruleApplied: `Conversational AI Agent (${process.env.GEMINI_MODEL || 'Gemini'})`,
    reason: r.departmentReasoning || `Routed to ${dept.label} by the AI agent.`,
    isVerifiedAssignment: true,
    targetRole: r.departmentKey,
  };
  const aiClassification = {
    summary: clean(r.title),
    suggestedCategory: dept.category,
    suggestedSubcategory: dept.subcategory,
    suggestedPriority: r.priority,
    suggestedResponsibleUnit: dept.unit,
    confidence: r.departmentConfidence || 0,
    missingInformation: r.missingInformation || [],
    requiresHumanReview: Boolean(r.requiresHumanReview),
    reason: `${r.departmentReasoning || ''} Urgency: ${r.urgencyReasoning || 'n/a'}`.trim(),
    analyzedAt: new Date(),
  };

  const payload = {
    user,
    ip,
    title: clean(r.title),
    description: clean(r.description),
    assignedCategory: dept.category,
    assignedSubcategory: dept.subcategory,
    location: clean(r.location) || (specificLocation ? `SEUSL Campus - ${specificLocation}` : user.faculty || 'SEUSL Campus'),
    specificLocation,
    parsedLocationDetails: {
      locationType: dept.locationType,
      facultyName: user.faculty || '',
      hostelName: r.hostelName || '',
      building: '',
      roomOrArea: specificLocation,
    },
    initialPriority: r.priority,
    isAnonymous: anonymous,
    finalImageUrl: attachments[0]?.url || '',
    attachments,
    routing,
    aiClassification,
  };

  // ticketNumber is random + unique: retry on the (rare) collision. It is the first write, so retrying is safe.
  for (let attempt = 0; ; attempt++) {
    try {
      return (await persistComplaint(payload)).complaint;
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.ticketNumber && attempt < 3) continue;
      throw err;
    }
  }
};

/** Atomically take the session for one turn; returns the session or a {status, message} rejection. */
export const acquireSession = async (sessionId, userId) => {
  const session = await AgentReportSession.findOneAndUpdate(
    {
      _id: sessionId,
      user: userId,
      status: 'active',
      // a lock older than STALE_LOCK_MS belongs to a crashed/abandoned turn
      $or: [{ busy: false }, { updatedAt: { $lt: new Date(Date.now() - STALE_LOCK_MS) } }],
    },
    { $set: { busy: true } },
    { new: true }
  );
  if (session) return { session };
  const existing = await AgentReportSession.findOne({ _id: sessionId, user: userId });
  if (!existing) return { status: 404, message: 'Conversation not found. Please start a new one.' };
  if (existing.status === 'submitted') {
    return { status: 409, message: `This report was already submitted as ${existing.ticketNumber}.`, session: existing };
  }
  return { status: 409, message: 'Still working on your previous message. Please wait a moment.' };
};

// @desc    One turn of the conversational AI reporting agent (text + optional pasted images)
// @route   POST /api/agent/report/message
// @access  Private (authenticated students)
export const sendReportMessage = async (req, res, next) => {
  const files = req.files || [];
  let session = null;
  let keepFiles = false;
  try {
    const text = String(req.body.text || '').trim();
    const retrySubmit = req.body.retrySubmit === 'true' || req.body.retrySubmit === true;
    const anonymous = req.body.anonymous === 'true' || req.body.anonymous === true;

    if (!retrySubmit && !text && files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please type a message or paste an image.' });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ success: false, message: `Messages are limited to ${MAX_TEXT_LENGTH} characters.` });
    }
    if (files.some((f) => !isRealImage(f))) {
      return res.status(400).json({ success: false, message: 'One of the attached files is not a valid image.' });
    }

    // ---- obtain / lock the conversation ----
    if (req.body.sessionId) {
      const acquired = await acquireSession(req.body.sessionId, req.user.id);
      if (!acquired.session || acquired.status) {
        return res.status(acquired.status).json({
          success: false,
          message: acquired.message,
          ...(acquired.session ? { ticketNumber: acquired.session.ticketNumber } : {}),
        });
      }
      session = acquired.session;
    } else {
      if (retrySubmit) return res.status(400).json({ success: false, message: 'Nothing to retry.' });
      session = await AgentReportSession.create({ user: req.user.id, busy: true });
    }

    const priorImages = session.messages.reduce((n, m) => n + (m.images?.length || 0), 0);
    if (priorImages + files.length > MAX_SESSION_IMAGES) {
      return res.status(400).json({ success: false, message: `A report can include at most ${MAX_SESSION_IMAGES} images.` });
    }

    session.isAnonymous = anonymous;
    const response = { success: true, sessionId: session._id, isAnonymous: anonymous };

    let decision = null;
    if (!retrySubmit) {
      const userMsg = {
        role: 'user',
        text,
        images: files.map((f) => ({
          url: `/uploads/${f.filename}`,
          filename: f.filename,
          path: f.path,
          mimeType: f.mimetype,
          size: f.size,
        })),
      };

      // The failed turn must not be persisted: nothing is saved until the model has answered.
      try {
        decision = await runReportTurn({
          messages: [...session.messages.map((m) => m.toObject()), userMsg],
          latestImages: userMsg.images,
          draft: session.draft,
          askedQuestions: session.askedQuestions,
          isAnonymous: anonymous,
          faculty: req.user.faculty,
        });
      } catch (aiErr) {
        console.error('[Report Agent Error]', aiErr.response?.data || aiErr.message);
        return res.status(503).json({
          success: false,
          message: 'The AI assistant is temporarily unavailable. Nothing was submitted - please try again in a moment.',
        });
      }

      session.messages.push(userMsg);
      keepFiles = true;
      session.draft = { ...decision.report };
      session.markModified('draft');
      const saved = session.messages[session.messages.length - 1];
      response.userMessage = publicMessage(saved);

      if (decision.action !== 'SUBMIT') {
        const assistantMsg = { role: 'assistant', text: decision.reply };
        if (decision.action === 'ASK') {
          assistantMsg.followUp = decision.followUp;
          session.askedQuestions.push(decision.followUp.question);
        }
        session.messages.push(assistantMsg);
        await session.save();
        response.message = publicMessage(session.messages[session.messages.length - 1]);
        response.draftSummary = draftSummary(session.draft);
        return res.json(response);
      }
      if (decision.report.requiresHumanReview) session.draft.requiresHumanReview = true;
      await session.save();
    }

    // ---- final submission (validated again inside fileReport) ----
    try {
      const complaint = await fileReport({ session, user: req.user, ip: req.ip });
      const confirmation = `Your report has been submitted to ${complaint.routingDecision.assignedUnit} as ${complaint.priority} priority. Your report ID is ${complaint.ticketNumber}.`;
      session.status = 'submitted';
      session.complaint = complaint._id;
      session.ticketNumber = complaint.ticketNumber;
      session.messages.push({ role: 'assistant', text: confirmation });
      await session.save();
      response.message = publicMessage(session.messages[session.messages.length - 1]);
      response.submitted = submittedSummary(complaint);
      return res.status(201).json(response);
    } catch (subErr) {
      console.error('[Report Agent Submit Error]', subErr.message);
      const msg = {
        role: 'assistant',
        text: "I understood your report but couldn't submit it just now, and nothing was filed. Tap Retry to try again.",
      };
      session.messages.push(msg);
      await session.save();
      response.success = false;
      response.submitFailed = true;
      response.message = publicMessage(session.messages[session.messages.length - 1]);
      response.draftSummary = draftSummary(session.draft);
      return res.status(subErr.statusCode === 422 ? 422 : 500).json(response);
    }
  } catch (err) {
    next(err);
  } finally {
    if (!keepFiles) removeFiles(files);
    if (session) {
      await AgentReportSession.updateOne({ _id: session._id }, { $set: { busy: false } }).catch(() => {});
    }
  }
};

// @desc    Restore a conversation after a page refresh
// @route   GET /api/agent/report/session/:id
// @access  Private (owner only)
export const getReportSession = async (req, res, next) => {
  try {
    const session = await AgentReportSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    res.json({
      success: true,
      sessionId: session._id,
      isAnonymous: session.isAnonymous,
      status: session.status,
      messages: session.messages.map(publicMessage),
      draftSummary: draftSummary(session.draft),
      ticketNumber: session.ticketNumber,
    });
  } catch (err) {
    next(err);
  }
};
