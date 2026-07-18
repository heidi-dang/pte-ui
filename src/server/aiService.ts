import { z } from 'zod';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Scoring result types — discriminated union, never a random invented score
// ---------------------------------------------------------------------------

export type ScoringStatus =
  | 'scored'
  | 'provider_unavailable'
  | 'empty_response'
  | 'pending_deterministic'; // objective tasks wait for Phase 4 engines

export interface ScoredResult {
  status: 'scored';
  score: number;
  fluencyScore?: number;
  pronunciationScore?: number;
  grammarIssues?: number;
  feedback: string;
}

export interface PendingResult {
  status: 'provider_unavailable' | 'empty_response' | 'pending_deterministic';
  reason: string;
}

export type ScoringResult = ScoredResult | PendingResult;

// ---------------------------------------------------------------------------
// Objective tasks — scored deterministically in Phase 4; never by AI
// ---------------------------------------------------------------------------
const DETERMINISTIC_TASKS = new Set([
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD', 'ASQ',
]);

// Open-response speaking tasks (need audio + transcription for real scoring)
const SPEAKING_TASKS = new Set(['RA', 'RS', 'DI', 'RL', 'SGD', 'RTS']);

// Open-response writing tasks
const WRITING_TASKS = new Set(['SWT', 'WE', 'SST']);

// ---------------------------------------------------------------------------
// DeepSeek caller
// ---------------------------------------------------------------------------
async function callDeepSeek(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// Provider abstraction for questionGeneration services
// ---------------------------------------------------------------------------
export interface AiProvider {
  generateCompletion(prompt: string, options?: { temperature?: number }): Promise<string>;
}

export function getAiProvider(): AiProvider {
  return {
    async generateCompletion(prompt: string, options?: { temperature?: number }): Promise<string> {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
      }
      const data = await response.json();
      return data.choices[0].message.content;
    }
  };
}

// ---------------------------------------------------------------------------
// Per-task AI rubric prompts for open-response tasks
// ---------------------------------------------------------------------------
function buildWritingSystemPrompt(taskCode: string): string {
  const rubrics: Record<string, string> = {
    SWT: `You are a PTE Academic examiner scoring Summarize Written Text responses.
Evaluate ONLY against these criteria:
1. Content (0-2): Does it capture the main idea accurately?
2. Form (0-1): Is it a single grammatically complete sentence of 5-75 words?
3. Grammar (0-2): Are grammar, spelling, and punctuation correct?
4. Vocabulary (0-2): Is vocabulary appropriate and accurate?
Score = content*2 + form*10 + grammar*10 + vocabulary*10, normalized to 10-90 scale.
Flag FORM_INVALID if: multiple sentences, fewer than 5 words, more than 75 words.`,

    WE: `You are a PTE Academic examiner scoring Write Essay responses.
Evaluate against these criteria:
1. Content/Topic Development (0-3): Arguments relevant, developed, supported?
2. Form (0-2): 200-300 words? Coherent essay structure?
3. Grammar Range/Accuracy (0-2): Correct and varied grammar?
4. Vocabulary Range (0-2): Accurate and wide range?
5. Spelling/Mechanics (0-1): Correct spelling and punctuation?
Flag FORM_INVALID if fewer than 120 words or more than 380 words (hard PTE limits).
Normalize final score to 10-90 scale.`,

    SST: `You are a PTE Academic examiner scoring Summarize Spoken Text responses.
Evaluate against:
1. Content (0-2): Are main points from the lecture captured?
2. Form (0-1): Is it 50-70 words?
3. Grammar (0-2): Grammatically correct?
4. Vocabulary (0-2): Appropriate vocabulary?
Flag FORM_INVALID if fewer than 50 or more than 70 words.
Normalize to 10-90.`,
  };
  return rubrics[taskCode] || rubrics['WE'];
}

function buildSpeakingSystemPrompt(taskCode: string): string {
  const base = `You are a PTE Academic examiner scoring a ${taskCode} speaking response.
You are receiving a TRANSCRIPT of the student's speech (not the audio itself).
Important: pronunciation and fluency scores are approximations based on transcript quality indicators only.
Evaluate:
1. Content (0-3): Does the student address the prompt accurately?
2. Oral Fluency indicators (0-2): Is the text continuous, without false starts or filler markers?
3. Vocabulary (0-2): Appropriate academic vocabulary?
Normalize all scores to the 10-90 PTE scale.`;

  const taskSpecific: Record<string, string> = {
    RA: `${base}
For Read Aloud: also check that the student reproduced the passage content accurately (word omissions, insertions, substitutions).`,
    DI: `${base}
For Describe Image: check coverage of key data points, trends, comparisons, and conclusion.`,
    RL: `${base}
For Retell Lecture: check accurate coverage of main points from the lecture content provided.`,
    SGD: `${base}
For Summarize Group Discussion: check coverage of multiple speakers' viewpoints and the overall discussion theme.`,
    RTS: `${base}
For Respond to a Situation: check register (formal/informal), appropriacy, and direct relevance to the situation.`,
  };

  return taskSpecific[taskCode] || base;
}

// ---------------------------------------------------------------------------
// Main evaluation entry point
// ---------------------------------------------------------------------------
export async function evaluateSubmission(
  taskCode: string,
  section: string,
  title: string,
  answerText: string,
  promptText?: string,
  answerKey?: string,
): Promise<ScoringResult> {
  logger.info(`Evaluating submission for ${taskCode} - "${title}" (${section})`);

  // Guard: deterministic tasks must not reach this function for scoring
  if (DETERMINISTIC_TASKS.has(taskCode)) {
    logger.info(`${taskCode} is an objective task — deferring to deterministic scorer`);
    return {
      status: 'pending_deterministic',
      reason: `${taskCode} uses answer-key scoring. Waiting for deterministic scoring engine.`,
    };
  }

  // Guard: empty response
  const sanitizedAnswer = (answerText || '').trim();
  if (!sanitizedAnswer) {
    return {
      status: 'empty_response',
      reason: 'No answer was provided. Submit a response before grading.',
    };
  }

  // Guard: placeholder speaking text must never be graded
  if (sanitizedAnswer === '[Speaking audio recorded for practice]') {
    return {
      status: 'empty_response',
      reason: 'Speaking placeholder text was submitted instead of a real transcript. Audio must be uploaded and transcribed before scoring.',
    };
  }

  // Build task-appropriate system prompt
  const systemPrompt = SPEAKING_TASKS.has(taskCode)
    ? buildSpeakingSystemPrompt(taskCode)
    : buildWritingSystemPrompt(taskCode);

  const prompt = `--- TASK CONTEXT ---
Task Code: ${taskCode}
Section: ${section}
Task Title: ${title}
Original Prompt / Question: ${promptText || 'N/A'}
${answerKey ? `Answer Key / Source Material:\n${answerKey}` : ''}

--- STUDENT'S WRITTEN OR TRANSCRIBED ANSWER ---
"${sanitizedAnswer}"

Evaluate and return a valid JSON object:
{
  "score": number (10-90),
  "fluencyScore": number | null,
  "pronunciationScore": number | null,
  "grammarIssues": number,
  "feedback": string,
  "formInvalid": boolean,
  "formInvalidReason": string | null
}`;

  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      logger.warn(`No DEEPSEEK_API_KEY — submission for ${taskCode} marked as provider_unavailable`);
      return {
        status: 'provider_unavailable',
        reason: 'AI scoring provider is not configured. The submission will remain pending until a provider is available.',
      };
    }

    logger.info('Attempting DeepSeek API grading...');
    const rawJson = await callDeepSeek(prompt, systemPrompt);
    const parsed = JSON.parse(rawJson);

    const score = Number(parsed.score);
    if (!Number.isFinite(score) || score < 10 || score > 90) {
      throw new Error(`Provider returned invalid score: ${parsed.score}`);
    }

    if (parsed.formInvalid) {
      logger.info(`${taskCode} submission failed form validation: ${parsed.formInvalidReason}`);
      return {
        status: 'scored',
        score: 10, // minimum for form failure per PTE rules
        feedback: `**Form Error**\n${parsed.formInvalidReason || 'Response did not meet the required format.'}\n\n${parsed.feedback || ''}`,
        grammarIssues: typeof parsed.grammarIssues === 'number' ? parsed.grammarIssues : 0,
      };
    }

    return {
      status: 'scored',
      score,
      fluencyScore: parsed.fluencyScore ? Number(parsed.fluencyScore) : undefined,
      pronunciationScore: parsed.pronunciationScore ? Number(parsed.pronunciationScore) : undefined,
      grammarIssues: typeof parsed.grammarIssues === 'number' ? parsed.grammarIssues : 0,
      feedback: parsed.feedback || 'Graded successfully.',
    };
  } catch (err: any) {
    logger.warn(`DeepSeek grading failed for ${taskCode}: ${err.message || err}`);
    // Do NOT fall back to random scores. Return pending so the worker can retry.
    return {
      status: 'provider_unavailable',
      reason: `AI scoring failed: ${err.message}. The submission will be retried automatically.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Diagnostic study plan generator
// ---------------------------------------------------------------------------
export async function generateDiagnosticStudyPlan(
  answers: Array<{ taskCode: string; title: string; section: string; answerText: string; promptText?: string }>,
): Promise<{
  estimatedScores: { speaking: number; writing: number; reading: number; listening: number };
  studyPlan: string;
}> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return {
      estimatedScores: { speaking: 0, writing: 0, reading: 0, listening: 0 },
      studyPlan: `### Diagnostic Study Plan Unavailable
The AI scoring provider is not configured. Please contact your administrator to enable AI evaluation.
Your diagnostic responses have been saved and can be re-evaluated once the provider is configured.`,
    };
  }

  const systemPrompt = `You are the Chief PTE Pedagogical Consultant and Diagnostic Assessor.
Review the user's answers to the diagnostic test, calculate estimated scores for the 4 core macro skills, and compile a highly detailed, personalized, evidence-based study plan.

The subscores must be integers between 10 and 90.

Output your response STRICTLY as a JSON object matching this structure:
{
  "estimatedScores": {
    "speaking": number,
    "writing": number,
    "reading": number,
    "listening": number
  },
  "studyPlan": string
}`;

  const prompt = `--- DIAGNOSTIC SUBMISSIONS ---
${JSON.stringify(answers, null, 2)}

Analyze the student's language profile, formulate estimated scores, and structure an elite, high-touch Study Plan detailing week-by-week practice routines, specific curriculum courses to take, and linguistic habits to fix.`;

  try {
    const rawJson = await callDeepSeek(prompt, systemPrompt);
    const parsed = JSON.parse(rawJson);
    return {
      estimatedScores: {
        speaking: Number(parsed.estimatedScores?.speaking) || 50,
        writing: Number(parsed.estimatedScores?.writing) || 50,
        reading: Number(parsed.estimatedScores?.reading) || 50,
        listening: Number(parsed.estimatedScores?.listening) || 50,
      },
      studyPlan: parsed.studyPlan || 'Personalized plan successfully created.',
    };
  } catch (err) {
    logger.error('Failed to generate diagnostic study plan via AI:', err);
    return {
      estimatedScores: { speaking: 0, writing: 0, reading: 0, listening: 0 },
      studyPlan: `### Diagnostic Analysis Failed
The AI provider encountered an error while generating your study plan. Please try again shortly.`,
    };
  }
}

// ---------------------------------------------------------------------------
// AI-assisted question generation (admin use only, never auto-published)
// ---------------------------------------------------------------------------
function getLocalGeneratedQuestion(taskCode: string, topic: string): any {
  const titles: Record<string, string[]> = {
    RA: ['Acoustic Physics', 'Deep Sea Exploration', 'Genetic Sequencing Protocols', 'Macroeconomic Fluidity', 'Renewable Infrastructure Developments'],
    RS: ['University Lecture Relocation', 'Digital Archives Protocol', 'Crop Yield Optimization', 'Cognitive Neurological Enhancement', 'Academic Literature Timeline'],
    DI: ['Global Energy Share Metrics', 'Medieval Silk Road Cargo Distributions', 'Deep Neural Network Topology', 'Terrestrial Planetary Density Indexes', 'Human Cortical Region Maps'],
    RL: ['Cognitive Pathways and Synaptic Reorganization', 'Johannes Gutenberg\'s Movable Metal Printing Press', 'Biochemical Nitrogen Fixation in Legumes', 'Glacial Ice Compression Chronicles', 'Deep Sea Chemosynthesis and Luciferase Enzymes'],
    ASQ: ['Astronomical Telescopes', 'Ancient Vellum Parchments', 'Biological Neural Nets', 'Atmospheric Abundance', 'Cardiovascular Pumps'],
    SWT: ['The Affordability of Cai Lun\'s Egyptian Papyrus and Chinese Paper', 'Internal Economic Stagnation and Romulus Augustulus\' Collapse', 'Public Key Encryption and Advanced Post-Quantum Computing Systems', 'Extraterrestrial Mineral Harvest on the Asteroid Belt Reserves', 'The Dual Role of the Lymphatic System in Host Immunity'],
    WE: ['Linguistic Evolution vs Automated Cognitive Replacement', 'Tax-Funded Architectural Preservation vs Skyscraper Expansion', 'Universal Basic Income Stipends and Work Incentive Elimination', 'Orbital Tourism and Atmospheric Carbon Depletion', 'CRISPR Genetic Engineering and the Genetic Class Gap'],
  };

  const prompts: Record<string, string[]> = {
    RA: [
      `Sound wave propagation through dense metallic structures is governed by elastic shear moduli and volumetric density anomalies, creating distinct supersonic acoustic pathways. Researchers must calibrate these waves meticulously to ensure accurate measurement.`,
      `Glaciers are massive rivers of ice that move very slowly under the force of gravity, acting as pristine natural archives of global climate history. As snow accumulates over thousands of years, it compresses previous layers into dense sheets.`,
    ],
    SWT: [
      `Cai Lun's invention of paper in 105 AD revolutionized historical archiving. Previously, scholars relied on expensive, heavy animal skins or bamboo reeds. When paper production reached Europe in the 11th century, it drastically lowered bookmaking costs, sparking a massive boom in scientific literacy.`,
    ],
    WE: [
      `Advanced automation and machine learning are predicted to eliminate millions of professional roles in the coming decade. Will this process trigger permanent structural unemployment, or will it catalyse superior, high-touch employment sectors? Discuss both sides and state your position.`,
    ],
  };

  const code = titles[taskCode] ? taskCode : 'RA';
  const poolTitles = titles[code];
  const poolPrompts = prompts[code] || prompts['RA'];

  const randIdx = Math.floor(Math.random() * poolTitles.length);
  const selectedTitle = poolTitles[randIdx];
  const selectedPrompt = poolPrompts[Math.min(randIdx, poolPrompts.length - 1)];

  const defaultInstructions: Record<string, string> = {
    RA: 'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.',
    RS: 'You will hear a sentence. Please repeat the sentence exactly as you hear it.',
    DI: 'Look at the chart below. In 25 seconds, please speak into the microphone and describe it in detail.',
    RL: 'You will hear a lecture. After listening to the lecture, please retell it in your own words.',
    ASQ: 'You will hear a simple question. Please give a brief, one-word or short answer.',
    SWT: 'Read the passage below and write a single-sentence summary of 5-75 words.',
    WE: 'Write an academic persuasive essay of 200-300 words on the topic provided.',
  };

  return {
    title: `${selectedTitle} (Draft — ${topic})`,
    instruction: defaultInstructions[code] || 'Complete the computer-based academic task.',
    promptText: selectedPrompt,
    vocab: [
      { phrase: 'Systemic dynamic', meaning: 'A set of connected parts that interact continuously within a larger process' },
    ],
  };
}

export async function generateQuestionTemplate(taskCode: string, topic?: string): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const targetTopic = topic || 'Academic Research and Technology';

  const systemPrompt = `You are an elite item writer and calibration designer for the Pearson Test of English Academic (PTE-A).
Generate a completely original, highly professional academic question template of type "${taskCode}" on the topic of "${targetTopic}".

CRITICAL: Generated items are DRAFTS for human review — never mark them as published.

Your response MUST be a valid JSON object:
{
  "title": "A short, engaging academic title",
  "instruction": "Standard PTE instruction for this task code",
  "promptText": "The actual text/description/transcript of the prompt",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct answer",
  "vocab": [{"phrase": "...", "meaning": "..."}]
}`;

  const prompt = `Generate a high-scoring, original PTE item of type "${taskCode}" on the topic "${targetTopic}" with standard Pearson difficulty calibration.`;

  try {
    if (apiKey) {
      logger.info(`Requesting DeepSeek to generate draft ${taskCode} template on topic: ${targetTopic}`);
      const rawJson = await callDeepSeek(prompt, systemPrompt);
      const parsed = JSON.parse(rawJson);
      return { ...parsed, code: taskCode, status: 'draft', reviewStatus: 'pending' };
    }
  } catch (err: any) {
    logger.warn(`DeepSeek question generation failed: ${err.message || err}. Falling back to local template.`);
  }

  const localItem = getLocalGeneratedQuestion(taskCode, targetTopic);
  return { ...localItem, code: taskCode, status: 'draft', reviewStatus: 'pending' };
}

// Zod schema for AI grading structured output — used by deepseek-smoke test
export const aiGradingSchema = z.object({
  score: z.number().min(0).max(90).optional(),
  fluencyScore: z.number().min(0).max(90).optional(),
  pronunciationScore: z.number().min(0).max(90).optional(),
  feedback: z.string().optional(),
  grammarIssues: z.number().min(0).optional(),
  skills: z.object({
    speaking: z.number().min(0).max(90).optional(),
    writing: z.number().min(0).max(90).optional(),
    reading: z.number().min(0).max(90).optional(),
    listening: z.number().min(0).max(90).optional(),
  }).optional(),
});
