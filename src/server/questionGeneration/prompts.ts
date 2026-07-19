import { TaskCode, QUESTION_REGISTRY } from '../../shared/questionTaskRegistry';

export const PROMPT_VERSION = '1.0.0';

function buildPayloadInstructions(taskCode: TaskCode): string {
  const schemaGuide: Record<string, string> = {
    RA: 'No additional payload fields needed. promptText should be the passage to read aloud.',
    RS: 'taskPayload must include: "sentence" (the sentence to repeat), "ttsScript" (text for TTS audio generation). promptText should be empty or the instruction only.',
    DI: 'taskPayload must include: "chartSpecification" (object with chartType, title, labels, series), "referencePoints" (array of key data points).',
    RL: 'taskPayload must include: "lectureScript" (the lecture text), "keyPoints" (array of key lecture points). promptText should be empty or the instruction only.',
    ASQ: 'taskPayload must include: "question" (the short question), "acceptedShortAnswers" (array of valid short answers). promptText should be empty or the instruction only.',
    SGD: 'taskPayload must include: "discussionScript" (group discussion text), "keyPoints" (array of discussion points). promptText should be empty.',
    RTS: 'taskPayload must include: "situationScript" (describe the situation), "responseCriteria" (what the response should address).',
    SWT: 'taskPayload must include: "keyPoints" (array of key points from the passage).',
    WE: 'taskPayload must include: "essayPrompt" (the essay topic/question), "positionGuidance" (guidance on position to take), "outline" (essay outline).',
    MCS: 'taskPayload must include: "options" (array of 4 answer choice strings), "correctAnswer" (the correct option string).',
    MCM: 'taskPayload must include: "options" (array of answer choice strings), "correctAnswers" (array of correct option strings).',
    ROP: 'taskPayload must include: "paragraphBlocks" (array of shuffled paragraph text strings), "canonicalOrder" (array of correct indices as strings).',
    FIBR: 'taskPayload must include: "options" (array of draggable word strings, more than blanks), "answerMap" (object mapping blank positions like "blank1" to correct word string).',
    FIBRW: 'taskPayload must include: "optionSets" (object mapping blank IDs like "blank1" to array of dropdown word strings), "answerMap" (object mapping blank IDs to correct word).',
    SST: 'taskPayload must include: "lectureScript" (the lecture audio script), "keyPoints" (array of main lecture points).',
    FIBL: 'taskPayload must include: "audioScript" (the audio transcript with gaps marked as "___"), "displayedBlanks" (array of blank identifiers), "answerMap" (object mapping blank to correct word).',
    HCS: 'taskPayload must include: "audioScript" (the audio transcript), "summaryOptions" (array of summary choice strings), "correctSummary" (the correct summary string).',
    MCSSL: 'taskPayload must include: "audioScript" (the audio transcript), "options" (array of answer choice strings), "correctAnswer" (the correct option string).',
    MCMSL: 'taskPayload must include: "audioScript" (the audio transcript), "options" (array of answer choice strings), "correctAnswers" (array of correct option strings).',
    SMW: 'taskPayload must include: "audioScript" (the audio transcript with final word replaced by "___"), "missingWordLocation" (description), "options" (array of word choice strings), "correctAnswer" (the missing word string).',
    HIW: 'taskPayload must include: "correctTranscript" (original transcript), "alteredDisplayTranscript" (transcript with altered words), "mismatchIndexes" (array of integer indices where words differ).',
    WFD: 'taskPayload must include: "dictationSentence" (the sentence to dictate), "canonicalTranscript" (the exact correct transcription). promptText should be empty.',
  };
  return schemaGuide[taskCode] || 'No specific payload requirements defined.';
}

export function buildGenerationPrompt(taskCode: TaskCode, difficulty: string, count: number, topic?: string): string {
  const taskDef = QUESTION_REGISTRY[taskCode];
  const payloadInstructions = buildPayloadInstructions(taskCode);
  return `
You are an expert curriculum designer for PTE (Pearson Test of English) Academic.
Your task is to generate exactly ${count} original practice question(s) for the task type: ${taskDef.name} (${taskCode}).

STRICT CONSTRAINTS:
1. Content must be original.
2. Do not reproduce official Pearson questions.
3. Do not copy known online practice questions.
4. Produce the exact selected task type.
5. Use Australian/British academic English consistently.
6. Produce plausible distractors rather than obviously incorrect options.
7. Include sufficient answer justification.
8. Keep the questions topically varied (unless a specific topic is requested).
${topic ? `\nTarget Topic/Domain: ${topic}` : ''}
Target Difficulty: ${difficulty}

You must return ONLY a JSON object with a "questions" array.
Each question object MUST include ALL of the following fields:
- title: short descriptive title
- instruction: the instruction shown to the test taker
- promptText: the text/content shown to the test taker (MANDATORY and must be non-empty string; for audio-only tasks use a short description)
- passageText: (if applicable) any reading passage (omit if not relevant)
- explanation: explanation of the correct answer
- difficulty: "${difficulty}"
- tags: array of topic tag strings
- taskPayload: an object containing the specific fields for this task type (see below)
- taskCode: "${taskCode}"

REQUIRED payload fields for ${taskCode}:
${payloadInstructions}

Do NOT include markdown code blocks. Return only valid JSON.
`;
}
