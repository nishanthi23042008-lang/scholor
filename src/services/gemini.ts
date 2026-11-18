import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_GUARDRAILS = `You are ScholarShield Assistant, an educational and cybersecurity guidance helper for Indian students.
STRICT RULES:
1. Base your answers ONLY on the verified scholarship record, deterministic eligibility results, required document checklist, or URL scan findings provided in the prompt context.
2. NEVER invent scholarship schemes, deadlines, award amounts, official portal URLs, or verification statuses.
3. If specific information is missing from the provided context, explicitly tell the student to check the official portal listed in the record and do not guess.
4. Keep explanations clear, concise, practical, and free of speculation. Never guarantee scholarship selection or website safety.`;

export async function generateGroundedExplanation(params: {
  mode: 'eligibility' | 'summary' | 'url_scan' | 'documents' | 'qa';
  question?: string;
  contextData: Record<string, unknown>;
}): Promise<string> {
  const ai = getGeminiClient();

  let prompt = '';
  switch (params.mode) {
    case 'eligibility':
      prompt = `Explain the student's rule-based eligibility evaluation clearly and constructively based ONLY on this data:\n${JSON.stringify(params.contextData, null, 2)}`;
      break;
    case 'summary':
      prompt = `Summarize this scholarship's purpose, benefits, deadline, verification status, and official application path in plain student-friendly language based ONLY on this verified record:\n${JSON.stringify(params.contextData, null, 2)}`;
      break;
    case 'url_scan':
      prompt = `Explain the cybersecurity URL scan findings in plain English so a student understands why these indicators matter and what precautions to take, based ONLY on this scan output:\n${JSON.stringify(params.contextData, null, 2)}`;
      break;
    case 'documents':
      prompt = `Explain why each required document in this checklist is needed for verification and common mistakes students should avoid, based ONLY on this checklist:\n${JSON.stringify(params.contextData, null, 2)}`;
      break;
    case 'qa':
      prompt = `Answer the student's question using ONLY the verified scholarship context below. If the answer is not in the context, state clearly what is unknown and advise checking the official portal.\n\nStudent Question: ${params.question || ''}\n\nVerified Context:\n${JSON.stringify(params.contextData, null, 2)}`;
      break;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_GUARDRAILS,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text.trim();
}
