import { answerUniversityQuestionRAG } from '../services/ragService.js';
import { executeAgentTool } from '../services/aiAgentService.js';
import { callChatCompletion } from '../services/openRouterService.js';

// @desc    Direct RAG Question Answering on university handbook and policies
// @route   POST /api/agent/rag/ask
// @access  Public / Optional Auth
export const askUniversityKnowledge = async (req, res, next) => {
  try {
    const { query, departmentScope } = req.body;
    if (!query || query.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a question query.' });
    }

    const result = await answerUniversityQuestionRAG(query, {
      departmentScope: departmentScope || 'UNIVERSITY_WIDE',
      userRole: req.user?.role || 'STUDENT',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Conversational AI Assistant for complaints, status queries, and campus policies
// @route   POST /api/agent/chat
// @access  Private (Authenticated users)
export const agentChat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const studentInfo = `Student Name: ${req.user.name}, Registration: ${req.user.registrationNumber || req.user.studentId}, Faculty: ${req.user.faculty}, Role: ${req.user.role}`;

    // First check if user is asking about an existing ticket
    const ticketMatch = message.match(/SEUSL-\d{4}-\d{5}/i);
    let ticketContext = '';

    if (ticketMatch) {
      try {
        const ticketResult = await executeAgentTool(
          'getComplaintStatus',
          { ticketId: ticketMatch[0] },
          { user: req.user }
        );
        if (ticketResult.success && ticketResult.complaint) {
          const c = ticketResult.complaint;
          ticketContext = `\nRetrieved Verified Ticket Details:\nTicket #${c.ticketNumber}\nTitle: ${c.title}\nStatus: ${c.status}\nPriority: ${c.priority}\nAssigned Unit: ${c.routingDecision?.assignedUnit || 'Unassigned'}\nCreated: ${new Date(c.createdAt).toLocaleDateString()}`;
        }
      } catch (tErr) {
        ticketContext = `\n(Note: Ticket query check: ${tErr.message})`;
      }
    }

    // Also retrieve relevant RAG knowledge context
    const ragResult = await answerUniversityQuestionRAG(message, {
      departmentScope: 'UNIVERSITY_WIDE',
      userRole: req.user.role,
    });

    const sources = ragResult.sources || [];

    try {
      const systemPrompt = `You are the UniConnect SmartResolve AI Campus Assistant for the South Eastern University of Sri Lanka (SEUSL).
Authenticated User Context: ${studentInfo}
${ticketContext}

Available Verified Policy Context:
${ragResult.answer}

Instructions:
1. Provide a clear, supportive, and grounded response to the student or staff member.
2. If the user mentions a problem they want to report, explain the required steps to submit a complaint through the "Submit Complaint" form or guide them on categories.
3. If they asked about a ticket, cite the exact status and assigned unit.
4. If referencing university regulations, base your answers on verified SEUSL policies.
5. Do not invent unauthorized emails, personal phone numbers, or arbitrary routing decisions.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4),
        { role: 'user', content: message },
      ];

      const reply = await callChatCompletion(messages, { temperature: 0.3 });

      res.json({
        success: true,
        reply,
        sources,
      });
    } catch (llmErr) {
      // Fallback answer
      res.json({
        success: true,
        reply: ragResult.answer,
        sources,
        isFallback: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Execute a verified backend tool
// @route   POST /api/agent/tool
// @access  Private (Authenticated users)
export const runAgentTool = async (req, res, next) => {
  try {
    const { toolName, args } = req.body;
    if (!toolName) {
      return res.status(400).json({ success: false, message: 'toolName is required.' });
    }

    const result = await executeAgentTool(toolName, args || {}, { user: req.user });

    res.json({
      success: true,
      toolName,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
