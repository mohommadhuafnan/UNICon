import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Send,
  ImagePlus,
  X,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Copy,
  RotateCcw,
  RefreshCw,
  Route,
} from 'lucide-react';

const MAX_PER_MESSAGE = 5;
const MAX_TOTAL = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const STARTERS = [
  'The AC in the library reading room has been broken for days',
  'There is no water in my hostel block since yesterday',
  'The food at the canteen today smelled stale',
  'The projector in our lecture hall is not working',
];

const PRIORITY_STYLES = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const PriorityBadge = ({ priority }) => (
  <span
    className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
      PRIORITY_STYLES[priority] || 'bg-gray-50 text-gray-700 border-gray-200'
    }`}
  >
    {priority}
  </span>
);

const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3.5">
    {[0, 150, 300].map((d) => (
      <span
        key={d}
        className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
        style={{ animationDelay: `${d}ms` }}
      />
    ))}
  </div>
);

const AssistantAvatar = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-500/30 flex-shrink-0">
    <Sparkles className="w-4 h-4" />
  </div>
);

const SESSION_KEY = (userId) => `uniconnect_agent_session_${userId}`;

export const AgentChat = () => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState([]); // [{ id, file, url }]
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draftInfo, setDraftInfo] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [canRetry, setCanRetry] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendingRef = useRef(false);

  const totalImages = messages.reduce((n, m) => n + (m.role === 'user' ? m.images?.length || 0 : 0), 0);
  const lastMessage = messages[messages.length - 1];
  const activeFollowUp = !submitted && !sending && lastMessage?.role === 'assistant' ? lastMessage.followUp : null;

  // Restore an unfinished conversation after a refresh
  useEffect(() => {
    const saved = user && sessionStorage.getItem(SESSION_KEY(user._id));
    if (!saved) return;
    api
      .get(`/agent/report/session/${saved}`)
      .then((res) => {
        const d = res.data;
        if (d.status === 'submitted') {
          sessionStorage.removeItem(SESSION_KEY(user._id));
          return;
        }
        setSessionId(d.sessionId);
        setMessages(d.messages);
        setAnonymous(d.isAnonymous);
        setDraftInfo(d.draftSummary);
      })
      .catch(() => sessionStorage.removeItem(SESSION_KEY(user._id)));
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, submitted]);

  // Auto-grow the textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback(
    (files) => {
      const room = Math.min(MAX_PER_MESSAGE - pending.length, MAX_TOTAL - totalImages - pending.length);
      const accepted = [];
      let problem = '';
      for (const file of files) {
        if (!ALLOWED.includes(file.type)) problem = 'Only JPG, PNG, WebP or GIF images are supported.';
        else if (file.size > MAX_BYTES) problem = 'Each image must be smaller than 5MB.';
        else if (accepted.length >= room) problem = `You can attach up to ${MAX_PER_MESSAGE} images per message (${MAX_TOTAL} per report).`;
        else accepted.push({ id: `${Date.now()}-${Math.random()}`, file, url: URL.createObjectURL(file) });
      }
      setError(problem);
      if (accepted.length) setPending((prev) => [...prev, ...accepted]);
    },
    [pending.length, totalImages]
  );

  const handlePaste = (e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (files.length === 0) return;
    // Let plain text paste normally; only swallow the event when it carried images alone
    if (!e.clipboardData.getData('text/plain')) e.preventDefault();
    addFiles(files);
  };

  const removePending = (id) => {
    setPending((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });
    setError((e) => (e.includes('images per message') ? '' : e));
  };

  const applyResponse = (data) => {
    if (data.sessionId) {
      setSessionId(data.sessionId);
      if (user) sessionStorage.setItem(SESSION_KEY(user._id), data.sessionId);
    }
    if (data.draftSummary !== undefined) setDraftInfo(data.draftSummary);
    if (data.submitted) {
      setSubmitted(data.submitted);
      if (user) sessionStorage.removeItem(SESSION_KEY(user._id));
    }
  };

  const send = async ({ text, files, retrySubmit = false }) => {
    if (sendingRef.current) return; // blocks double clicks / double Enter
    sendingRef.current = true;
    setSending(true);
    setError('');
    setCanRetry(false);

    const optimisticId = `local-${Date.now()}`;
    if (!retrySubmit) {
      setMessages((prev) => [
        ...prev.map((m) => (m.followUp ? { ...m, followUp: undefined } : m)),
        { id: optimisticId, role: 'user', text, images: files.map((f) => ({ url: f.url })) },
      ]);
    }

    try {
      const fd = new FormData();
      if (sessionId) fd.append('sessionId', sessionId);
      fd.append('text', text);
      fd.append('anonymous', String(anonymous));
      if (retrySubmit) fd.append('retrySubmit', 'true');
      files.forEach((f) => fd.append('images', f.file, f.file.name || 'pasted-image.png'));

      const res = await api.post('/agent/report/message', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      const data = res.data;
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        ...(data.userMessage ? [{ ...data.userMessage, images: data.userMessage.images?.length ? data.userMessage.images : files.map((f) => ({ url: f.url })) }] : []),
        data.message,
      ]);
      applyResponse(data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.submitFailed) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticId),
          ...(data.userMessage ? [data.userMessage] : []),
          data.message,
        ]);
        applyResponse(data);
        setCanRetry(true);
      } else if (err.response?.status === 409 && data?.ticketNumber) {
        setSubmitted({ ticketNumber: data.ticketNumber, alreadySubmitted: true });
      } else {
        // Nothing was saved server-side: take the message back out and restore the composer
        if (!retrySubmit) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setInput(text);
          setPending(files);
          files = [];
        }
        setError(data?.message || 'Something went wrong. Please check your connection and try again.');
      }
    } finally {
      files.forEach((f) => URL.revokeObjectURL(f.url));
      sendingRef.current = false;
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if ((!text && pending.length === 0) || sendingRef.current) return;
    const files = pending;
    setInput('');
    setPending([]);
    send({ text, files });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const reset = () => {
    pending.forEach((p) => URL.revokeObjectURL(p.url));
    if (user) sessionStorage.removeItem(SESSION_KEY(user._id));
    setSessionId(null);
    setMessages([]);
    setInput('');
    setPending([]);
    setDraftInfo(null);
    setSubmitted(null);
    setError('');
    setCanRetry(false);
  };

  const copyTicket = async () => {
    try {
      await navigator.clipboard.writeText(submitted.ticketNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="flex flex-col h-[calc(100vh-21rem)] min-h-[520px] rounded-3xl border border-gray-200 bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-white via-brand-50/60 to-white">
        <div className="flex items-center gap-3 min-w-0">
          <AssistantAvatar />
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 leading-tight">UniConnect Assistant</div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Routes your report to the right department
            </div>
          </div>
        </div>
        {(messages.length > 0 || submitted) && (
          <button
            type="button"
            onClick={reset}
            disabled={sending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 bg-gradient-to-b from-white to-gray-50/50">
        {messages.length === 0 && !submitted && (
          <div className="h-full flex flex-col items-center justify-center text-center px-2">
            <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 mb-5">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Hi{firstName ? ` ${firstName}` : ''}, what's going on?
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md leading-relaxed">
              Describe the problem in your own words. I'll work out which department should handle it, how urgent it is, and file the report for you.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  className="text-left text-xs text-gray-700 px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                {m.images?.length > 0 && (
                  <div className={`grid gap-1.5 ${m.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} justify-items-end`}>
                    {m.images.map((img, i) => (
                      <a key={img.id || img.url || i} href={img.url} target="_blank" rel="noreferrer">
                        <img src={img.url} alt="Attached" className="rounded-2xl max-h-44 object-cover border border-gray-200 shadow-sm" />
                      </a>
                    ))}
                  </div>
                )}
                {m.text && (
                  <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm leading-relaxed shadow-sm shadow-brand-500/20 whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-3">
              <AssistantAvatar />
              <div className="max-w-[85%] sm:max-w-[75%]">
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-white border border-gray-200 text-sm text-gray-800 leading-relaxed shadow-sm whitespace-pre-wrap break-words">
                  {m.text}
                </div>
              </div>
            </div>
          )
        )}

        {sending && (
          <div className="flex items-start gap-3">
            <AssistantAvatar />
            <div className="rounded-2xl rounded-tl-md bg-white border border-gray-200 shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Selectable follow-up answers */}
        {activeFollowUp && activeFollowUp.suggestedAnswers?.length > 0 && (
          <div className="pl-11 space-y-2">
            <div className="flex flex-wrap gap-2">
              {activeFollowUp.suggestedAnswers.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => send({ text: a, files: [] })}
                  className="px-3.5 py-2 rounded-full border border-brand-200 bg-white text-xs font-semibold text-brand-700 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all shadow-sm"
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-gray-400">…or type your own answer below</div>
          </div>
        )}

        {canRetry && !sending && (
          <div className="pl-11">
            <button
              type="button"
              onClick={() => send({ text: '', files: [], retrySubmit: true })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry submission
            </button>
          </div>
        )}

        {/* Submission confirmation - only rendered after the backend confirmed the save */}
        {submitted && (
          <div className="mx-auto max-w-md rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {submitted.alreadySubmitted ? 'Already submitted' : 'Report submitted'}
                </div>
                <div className="text-[11px] text-gray-500">The responsible department has been notified.</div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white border border-emerald-100 px-4 py-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Report ID</div>
                <div className="font-mono text-base font-black text-gray-900">{submitted.ticketNumber}</div>
              </div>
              <button
                type="button"
                onClick={copyTicket}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {submitted.department && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Department</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{submitted.department}</div>
                </div>
                <div className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Priority</div>
                  <div className="mt-0.5">
                    <PriorityBadge priority={submitted.priority} />
                  </div>
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  {submitted.imageCount > 0 && <span>{submitted.imageCount} image{submitted.imageCount > 1 ? 's' : ''} attached</span>}
                  {submitted.isAnonymous && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-900 text-white font-semibold">
                      <EyeOff className="w-3 h-3" /> Submitted anonymously
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {submitted.complaintId && (
                <Link
                  to={`/campuscare/${submitted.complaintId}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm"
                >
                  View report <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={reset}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                Report something else
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      {!submitted && (
        <div className="border-t border-gray-100 bg-white px-4 sm:px-6 pt-3 pb-4 space-y-2.5">
          {anonymous && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              <span>
                <strong>Anonymous mode.</strong> Your name and registration number are not shared with the department.
              </span>
            </div>
          )}

          {draftInfo && !sending && (
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <Route className="w-3.5 h-3.5 text-brand-500" />
              <span>
                Routing to <strong className="text-gray-800">{draftInfo.department}</strong>
              </span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                Priority <PriorityBadge priority={draftInfo.priority} />
              </span>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>
          )}

          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pending.map((p) => (
                <div key={p.id} className="relative group">
                  <img src={p.url} alt="Pasted preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                  <button
                    type="button"
                    onClick={() => removePending(p.id)}
                    aria-label="Remove image"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 focus-within:bg-white focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100 transition-all px-2 py-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              title="Attach images (or paste with Ctrl+V)"
              className="p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              maxLength={2000}
              disabled={sending}
              placeholder={activeFollowUp ? 'Type your own answer…' : 'Describe the problem… paste screenshots with Ctrl+V'}
              style={{ outline: "none", boxShadow: "none" }}
              className="flex-1 resize-none bg-transparent border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400 py-2 max-h-40"
            />

            <button
              type="button"
              onClick={() => setAnonymous((a) => !a)}
              disabled={sending}
              aria-pressed={anonymous}
              title="Report without sharing your identity"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                anonymous ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Anonymous</span>
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!input.trim() && pending.length === 0)}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/30 hover:shadow-md disabled:opacity-40 disabled:shadow-none transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-gray-400 text-center">
            Enter to send · Shift+Enter for a new line · Ctrl+V to paste images (up to {MAX_PER_MESSAGE} per message)
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;
