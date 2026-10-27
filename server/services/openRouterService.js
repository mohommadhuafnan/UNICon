import axios from 'axios';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const CHAT_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b';
const EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b:free';

// Bounded timeout
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Helper to call OpenRouter Chat Completion API
 */
export const callChatCompletion = async (messages, options = {}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY_NOT_CONFIGURED');
  }

  const payload = {
    model: options.model || CHAT_MODEL,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens || 1000,
    ...(options.response_format ? { response_format: options.response_format } : {}),
  };

  const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://unicon-eight.vercel.app',
      'X-Title': 'UniConnect SmartResolve SEUSL',
      'Content-Type': 'application/json',
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  return response.data?.choices?.[0]?.message?.content || '';
};

/**
 * Generate embedding vector using OpenRouter or deterministic fallback
 */
export const generateEmbedding = async (text) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_openrouter_api_key_here') {
    try {
      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/embeddings`,
        {
          model: EMBED_MODEL,
          input: text.slice(0, 2000),
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      const vector = response.data?.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length > 0) {
        return vector;
      }
    } catch (err) {
      console.warn('[OpenRouter Embedding Warning] API call failed, using fallback vectorizer:', err.message);
    }
  }

  // Fallback: 128-dimensional hashed bag-of-words pseudo-embedding for local offline/testing search
  return generateDeterministicPseudoEmbedding(text);
};

/**
 * Classify a university complaint using Nemotron 3 Super 120B with rule-based fallback
 */
export const classifyComplaintWithAI = async ({ title, description, location, faculty }) => {
  const fullText = `Title: ${title}\nDescription: ${description}\nLocation: ${location || 'Not specified'}\nFaculty: ${faculty || 'Not specified'}`;

  try {
    const prompt = `You are the AI Complaint Intelligence Engine for the South Eastern University of Sri Lanka (SEUSL).
Analyze the student complaint below and output a STRICT JSON object with these keys:
{
  "category": "FACULTY_RELATED" | "HOSTEL_ACCOMMODATION" | "LIBRARY" | "CANTEEN_FOOD" | "CAMPUS_MAINTENANCE" | "OTHER_SERVICES",
  "subcategory": "String subcategory e.g. WATER_SUPPLY, ELECTRICITY, LAB_EQUIPMENT, WI_FI, CLASSROOM_FURNITURE, CLEANLINESS, FOOD_QUALITY",
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedResponsibleUnit": "Maintenance Division" | "ICT Centre" | "Library Services" | "Cafeteria Services" | "Student Welfare" | "Health Centre" | "Security Division",
  "summary": "Concise 1-2 sentence professional summary of the issue",
  "missingInformation": ["List of any critical details the student forgot to mention, e.g. room number, error code"],
  "confidence": 0.85,
  "requiresHumanReview": boolean,
  "reason": "Brief explanation for this classification decision"
}

Complaint:
${fullText}

Return ONLY valid raw JSON with NO markdown ticks.`;

    const rawResponse = await callChatCompletion(
      [
        { role: 'system', content: 'You are a university complaint classifier. Respond only in valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.1 }
    );

    const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate schema fields
    return {
      category: parsed.category || 'CAMPUS_MAINTENANCE',
      subcategory: parsed.subcategory || 'GENERAL',
      suggestedPriority: parsed.suggestedPriority || 'MEDIUM',
      suggestedResponsibleUnit: parsed.suggestedResponsibleUnit || 'Maintenance Division',
      summary: parsed.summary || title,
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      requiresHumanReview: Boolean(parsed.requiresHumanReview),
      reason: parsed.reason || 'Classified by Nemotron 3 Super 120B',
      isAiGenerated: true,
    };
  } catch (error) {
    // Graceful Rule-Based NLP Fallback if API key missing or provider network error
    return ruleBasedComplaintClassifier({ title, description, location, faculty });
  }
};

/**
 * Deterministic rule-based classifier as resilient fallback
 */
export const ruleBasedComplaintClassifier = ({ title, description, location = '', faculty = '' }) => {
  const text = `${title} ${description} ${location}`.toLowerCase();

  let category = 'CAMPUS_MAINTENANCE';
  let subcategory = 'GENERAL_REPAIRS';
  let suggestedResponsibleUnit = 'Maintenance Division';
  let priority = 'MEDIUM';
  let missingInformation = [];
  let reason = 'Deterministic rule-based classification (AI fallback).';

  if (text.includes('hostel') || text.includes('room') || text.includes('warden') || text.includes('dorm')) {
    category = 'HOSTEL_ACCOMMODATION';
    suggestedResponsibleUnit = 'Hostel Administration & Maintenance';
    if (text.includes('water') || text.includes('tap') || text.includes('shower') || text.includes('tank')) {
      subcategory = 'WATER_SUPPLY';
      priority = 'HIGH';
    } else if (text.includes('light') || text.includes('power') || text.includes('fan') || text.includes('electric')) {
      subcategory = 'ELECTRICITY';
    } else if (text.includes('bed') || text.includes('cupboard') || text.includes('table')) {
      subcategory = 'FURNITURE';
    }
  } else if (text.includes('library') || text.includes('book') || text.includes('reading room')) {
    category = 'LIBRARY';
    subcategory = 'FACILITIES';
    suggestedResponsibleUnit = 'Library Services';
    if (text.includes('ac') || text.includes('air conditioning')) subcategory = 'AIR_CONDITIONING';
    if (text.includes('computer') || text.includes('pc')) subcategory = 'COMPUTERS';
  } else if (text.includes('canteen') || text.includes('cafeteria') || text.includes('food') || text.includes('meal')) {
    category = 'CANTEEN_FOOD';
    subcategory = 'FOOD_QUALITY_HYGIENE';
    suggestedResponsibleUnit = 'Cafeteria Services';
    if (text.includes('poison') || text.includes('unhygienic') || text.includes('spoiled')) {
      priority = 'CRITICAL';
    }
  } else if (text.includes('wifi') || text.includes('wi-fi') || text.includes('internet') || text.includes('network') || text.includes('server')) {
    category = 'OTHER_SERVICES';
    subcategory = 'ICT_NETWORK';
    suggestedResponsibleUnit = 'ICT Centre';
    priority = 'MEDIUM';
  } else if (text.includes('lab') || text.includes('lecture') || text.includes('projector') || text.includes('hall')) {
    category = 'FACULTY_RELATED';
    subcategory = 'CLASSROOM_EQUIPMENT';
    suggestedResponsibleUnit = 'Faculty Administration';
  }

  if (!location || location.trim().length < 3) {
    missingInformation.push('Specific building/hall location details are missing.');
  }

  return {
    category,
    subcategory,
    subCategory: subcategory,
    suggestedPriority: priority,
    suggestedResponsibleUnit,
    urgencyScore: priority === 'CRITICAL' ? 5 : priority === 'HIGH' ? 4 : 3,
    sentiment: priority === 'HIGH' || priority === 'CRITICAL' ? 'Urgent / Distressed' : 'Neutral',
    summary: `${title}: ${description.slice(0, 120)}...`,
    missingInformation,
    confidence: 0.78,
    requiresHumanReview: priority === 'CRITICAL' || missingInformation.length > 0,
    reason,
    reasoning: reason,
    isAiGenerated: false,
  };
};

/**
 * Deterministic pseudo-embedding for local RAG retrieval when OpenRouter is offline
 */
function generateDeterministicPseudoEmbedding(text) {
  const dim = 128;
  const vector = new Array(dim).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vector[idx] += 1;
  }

  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => val / norm);
}

/**
 * Cosine similarity between two vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
