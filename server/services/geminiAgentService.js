import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Call Google Gemini REST API to analyze & route a student complaint
 * Classifies into:
 *  - FACULTY_OFFICER  (Faculty of Technology, Engineering, Applied Sciences, FMC, etc.)
 *  - LIBRARY_OFFICER  (Library books, study spaces, book lending, reading rooms, digital library)
 *  - HOSTEL_WARDEN    (Hostels, dormitories, residential halls, hostel water/electricity/rooms)
 *  - CANTEEN_MANAGER  (Campus cafeteria, student canteen, meal hygiene, dining prices/food)
 */
export const classifyComplaintWithGemini = async ({
  text,
  title,
  description,
  faculty = '',
}) => {
  const content = (text || `${title || ''}\n${description || ''}`).trim();

  const prompt = `You are the AI Complaint Intelligence & Decision Routing Agent for South Eastern University of Sri Lanka (SEUSL).

A student submitted this university complaint:
"""
${content}
"""
Student Faculty: ${faculty || 'General University'}

Your task is to analyze and categorize this complaint, and intelligently route it to EXACTLY ONE of these 4 university officials:
1. "FACULTY_OFFICER" -> for academic issues, lecture hall projectors/equipment, lab issues, faculty building facilities, exam clashes, department queries.
2. "LIBRARY_OFFICER" -> for library book availability, reading room AC/noise, study desks, missing book pages, digital library access, library fines.
3. "HOSTEL_WARDEN"   -> for student hostels/dorms (Hijra, Zahira, Al-Aqsa, Bilal, Fathima), hostel water, electricity in dorm room, bed/cupboard, sub-warden matters.
4. "CANTEEN_MANAGER"  -> for university canteens, student cafeteria, dining hygiene, stale food, tea/meal prices, canteen drinking water.

Output a STRICT raw JSON object with NO markdown ticks, NO extra words:
{
  "targetRole": "FACULTY_OFFICER" | "LIBRARY_OFFICER" | "HOSTEL_WARDEN" | "CANTEEN_MANAGER",
  "assignedUnit": "Faculty Administration" | "Library Services" | "Hostel Administration & Welfare" | "Cafeteria Services",
  "categoryKey": "FACULTY_RELATED" | "LIBRARY" | "HOSTEL_ACCOMMODATION" | "CANTEEN_FOOD",
  "confidence": 0.95,
  "summary": "1-sentence clear summary of the complaint",
  "reasoning": "Clear explanation of why this complaint was routed to this official",
  "suggestedPriority": "Low" | "Medium" | "High" | "Critical"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000,
      }
    );

    const rawText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const validRoles = [
      'FACULTY_OFFICER',
      'LIBRARY_OFFICER',
      'HOSTEL_WARDEN',
      'CANTEEN_MANAGER',
    ];
    const role = validRoles.includes(parsed.targetRole)
      ? parsed.targetRole
      : fallbackRoleFromKeywords(content);

    return {
      success: true,
      targetRole: role,
      assignedUnit: parsed.assignedUnit || getUnitForRole(role),
      categoryKey: parsed.categoryKey || getCategoryKeyForRole(role),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      summary: parsed.summary || content.slice(0, 80),
      reasoning: parsed.reasoning || `Classified by Google Gemini AI (${GEMINI_MODEL})`,
      suggestedPriority: parsed.suggestedPriority || 'Medium',
      aiModel: GEMINI_MODEL,
    };
  } catch (err) {
    console.warn('[Gemini AI Router Notice] Falling back to keyword engine:', err.message);
    const fallbackRole = fallbackRoleFromKeywords(content);
    return {
      success: true,
      targetRole: fallbackRole,
      assignedUnit: getUnitForRole(fallbackRole),
      categoryKey: getCategoryKeyForRole(fallbackRole),
      confidence: 0.85,
      summary: content.slice(0, 80),
      reasoning: `Rule-based keyword routing (Gemini fallback: ${err.message})`,
      suggestedPriority: 'Medium',
      aiModel: 'Deterministic-NLP-Fallback',
    };
  }
};

export const getUnitForRole = (role) => {
  switch (role) {
    case 'LIBRARY_OFFICER':
      return 'Library Services';
    case 'HOSTEL_WARDEN':
      return 'Hostel Administration & Welfare';
    case 'CANTEEN_MANAGER':
      return 'Cafeteria Services';
    case 'FACULTY_OFFICER':
    default:
      return 'Faculty Administration';
  }
};

export const getCategoryKeyForRole = (role) => {
  switch (role) {
    case 'LIBRARY_OFFICER':
      return 'LIBRARY';
    case 'HOSTEL_WARDEN':
      return 'HOSTEL_ACCOMMODATION';
    case 'CANTEEN_MANAGER':
      return 'CANTEEN_FOOD';
    case 'FACULTY_OFFICER':
    default:
      return 'FACULTY_RELATED';
  }
};

export const fallbackRoleFromKeywords = (text = '') => {
  const lower = text.toLowerCase();

  // 1. Library check
  if (
    lower.includes('library') ||
    lower.includes('book') ||
    lower.includes('librarian') ||
    lower.includes('reading room') ||
    lower.includes('borrow') ||
    lower.includes('journal')
  ) {
    return 'LIBRARY_OFFICER';
  }

  // 2. Hostel check
  if (
    lower.includes('hostel') ||
    lower.includes('dorm') ||
    lower.includes('room') ||
    lower.includes('warden') ||
    lower.includes('hijra') ||
    lower.includes('zahira') ||
    lower.includes('bed') ||
    lower.includes('shower') ||
    lower.includes('subwarden') ||
    lower.includes('sub-warden')
  ) {
    return 'HOSTEL_WARDEN';
  }

  // 3. Canteen check
  if (
    lower.includes('canteen') ||
    lower.includes('cafeteria') ||
    lower.includes('food') ||
    lower.includes('meal') ||
    lower.includes('lunch') ||
    lower.includes('breakfast') ||
    lower.includes('dining') ||
    lower.includes('tea') ||
    lower.includes('cook')
  ) {
    return 'CANTEEN_MANAGER';
  }

  // Default to Faculty Officer
  return 'FACULTY_OFFICER';
};

