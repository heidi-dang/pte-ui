import { TaskCode, QUESTION_REGISTRY } from '../../shared/questionTaskRegistry';

export const PROMPT_VERSION = '2.0.0';

const TASK_GUIDELINES: Record<TaskCode, string> = {
  RA: "Passage should be 50-70 words long. Use academic vocabulary (science, history, literature, biology). Ensure complex sentence structures.",
  RS: "Sentence should be exactly 8-14 words long. Use academic, campus, or business vocabulary. Must be a single, coherent, grammatical sentence.",
  DI: "Generate data for a statistical chart (bar, line, pie, or table). Include 3-5 categories/labels, realistic numerical series, and 3 key observations that summarize the highest/lowest points.",
  RL: "Lecture script should be 120-160 words (about 60-90 seconds spoken). Topics must be academic. Include a clear introduction, 2-3 main points, and a conclusion. Extract 3 key points.",
  ASQ: "Question should be a general knowledge or common sense academic question requiring a 1-3 word answer. Provide 2-3 accepted short answers.",
  SGD: "Discussion script should be a dialogue between 2-3 academic speakers (e.g., Professor and students). Length: 100-150 words. Extract 3 key points.",
  RTS: "Create a common university or professional situation (e.g. asking a professor for an extension). Define 3 response criteria the student must meet.",
  SWT: "Passage text must be 150-300 words. Provide a one-sentence sample summary (under 75 words) and 3 key points.",
  WE: "Essay prompt must be a controversial academic or societal topic. Provide a 200-300 word sample essay, 2 position guidance points, and a 3-point outline.",
  MCS: "Passage should be 100-200 words. Provide 4 options, exactly 1 correct answer, and an explanation mapping for each option.",
  MCM: "Passage should be 150-250 words. Provide 5-6 options, exactly 2 or 3 correct answers.",
  ROP: "Provide 4-5 paragraph blocks (each 20-50 words) that tell a logical story or academic process. They must be out of order in the 'paragraphBlocks' array, and correctly ordered in 'canonicalOrder'.",
  FIBR: "Passage should be 80-150 words. Replace 4-5 key academic words with [[blank_1]], [[blank_2]], etc. Provide 6-8 options (more than blanks), and an answer map.",
  FIBRW: "Passage should be 100-200 words. Replace 4-5 words with [[blank_1]], [[blank_2]]. Provide 4 options per blank in 'optionSets', and an answer map.",
  SST: "Lecture script should be 150-200 words. Provide a 50-70 word sample answer summary and 3 key points.",
  MCMSL: "Audio script should be 150-200 words. Provide 5 options and exactly 2 or 3 correct answers based on the audio.",
  FIBL: "Audio script should be 80-120 words. Provide the exact same text as 'displayedBlanks' but with 4-5 key words replaced by [[blank_1]]. Provide the exact missing words in 'answerMap'.",
  HCS: "Audio script should be 120-180 words. Provide 4 summary options (each 30-50 words). Only 1 summary is correct.",
  MCSSL: "Audio script should be 100-150 words. Provide 4 options and exactly 1 correct answer.",
  SMW: "Audio script should be 80-120 words. End the script with 'BEEP' or indicate where the beep is. Provide 4 options for the missing word/phrase and 1 correct answer.",
  HIW: "Provide a 'correctTranscript' (80-120 words). Provide an 'alteredDisplayTranscript' where exactly 4-6 words are replaced with similar-sounding incorrect words. Identify the word indexes in 'mismatchIndexes'.",
  WFD: "Dictation sentence should be exactly 8-14 words long. Use academic or campus life themes."
};

export const TASK_TEMPLATES: Record<TaskCode, any> = {
  RA: {
    title: "Title of the passage", instruction: "Read the text aloud as naturally and clearly as possible.", promptText: "Read Aloud", difficulty: "medium", tags: ["RA", "academic"], explanation: "Explanation of difficult words",
    taskCode: "RA", passageText: "The passage text here...", taskPayload: { pronunciationNotes: ["word1", "word2"] }
  },
  RS: {
    title: "Repeat Sentence Question", instruction: "You will hear a sentence. Please repeat the sentence exactly as you hear it.", promptText: "Repeat Sentence", difficulty: "medium", tags: ["RS"],
    taskCode: "RS", taskPayload: { sentence: "The exact sentence here.", referenceTranscript: "The exact sentence here.", ttsScript: "The exact sentence here." }
  },
  DI: {
    title: "Chart Title", instruction: "Describe the image in detail.", promptText: "Describe Image", difficulty: "medium", tags: ["DI", "chart"],
    taskCode: "DI", taskPayload: { chartSpecification: { chartType: "bar", title: "Chart Title", labels: ["A", "B", "C"], series: [{ name: "Data 1", values: [10, 20, 30] }], units: "percentage", keyObservations: ["obs 1", "obs 2"] }, referencePoints: ["ref 1", "ref 2"] }
  },
  RL: {
    title: "Lecture Title", instruction: "You will hear a lecture. After listening, retell what you have just heard.", promptText: "Retell Lecture", difficulty: "medium", tags: ["RL", "lecture"], sampleAnswer: "Sample retelling...",
    taskCode: "RL", taskPayload: { lectureScript: "The full lecture script...", keyPoints: ["point 1", "point 2", "point 3"] }
  },
  ASQ: {
    title: "Short Question", instruction: "You will hear a question. Please give a simple and short answer.", promptText: "Answer Short Question", difficulty: "easy", tags: ["ASQ"],
    taskCode: "ASQ", taskPayload: { question: "What is the study of living organisms called?", acceptedShortAnswers: ["Biology", "Life science"] }
  },
  SGD: {
    title: "Group Discussion", instruction: "Listen to the discussion and summarize it.", promptText: "Summarize Group Discussion", difficulty: "medium", tags: ["SGD"],
    taskCode: "SGD", taskPayload: { discussionScript: "Speaker A: ... Speaker B: ...", keyPoints: ["point 1", "point 2"] }
  },
  RTS: {
    title: "Situation Title", instruction: "Listen to the situation and respond appropriately.", promptText: "Respond to a Situation", difficulty: "medium", tags: ["RTS"],
    taskCode: "RTS", taskPayload: { situationScript: "You are talking to...", responseCriteria: ["Must apologize", "Must offer solution"] }
  },
  SWT: {
    title: "Summary Title", instruction: "Read the passage and write a one-sentence summary.", promptText: "Summarize Written Text", difficulty: "hard", tags: ["SWT"], sampleAnswer: "The one-sentence summary.",
    taskCode: "SWT", passageText: "The full passage...", taskPayload: { keyPoints: ["point 1", "point 2"] }
  },
  WE: {
    title: "Essay Topic", instruction: "Write an essay on the given topic.", promptText: "Write Essay", difficulty: "hard", tags: ["WE", "essay"], sampleAnswer: "Full essay sample...",
    taskCode: "WE", taskPayload: { essayPrompt: "The essay prompt...", positionGuidance: ["guidance 1"], outline: ["outline 1"] }
  },
  MCS: {
    title: "Multiple Choice Single", instruction: "Read the text and answer the multiple-choice question by selecting the correct response.", promptText: "Select correct response", difficulty: "medium", tags: ["MCS"],
    taskCode: "MCS", passageText: "Passage here...", taskPayload: { options: ["opt 1", "opt 2", "opt 3", "opt 4"], correctAnswer: "opt 2", optionExplanations: { "opt 1": "Why incorrect", "opt 2": "Why correct" } }
  },
  MCM: {
    title: "Multiple Choice Multiple", instruction: "Read the text and answer the question by selecting all the correct responses.", promptText: "Select all correct responses", difficulty: "hard", tags: ["MCM"],
    taskCode: "MCM", passageText: "Passage here...", taskPayload: { options: ["opt 1", "opt 2", "opt 3", "opt 4", "opt 5"], correctAnswers: ["opt 1", "opt 3"] }
  },
  ROP: {
    title: "Re-order Paragraphs", instruction: "Restore the original order by dragging the text boxes.", promptText: "Re-order", difficulty: "hard", tags: ["ROP"],
    taskCode: "ROP", taskPayload: { paragraphBlocks: ["Block B...", "Block C...", "Block A..."], canonicalOrder: ["Block A...", "Block B...", "Block C..."], transitionExplanations: ["A to B...", "B to C..."] }
  },
  FIBR: {
    title: "Fill in the Blanks Reading", instruction: "Drag words from the box below to the appropriate place in the text.", promptText: "Drag and drop", difficulty: "medium", tags: ["FIBR"],
    taskCode: "FIBR", passageText: "This is a [[blank_1]] and this is a [[blank_2]].", taskPayload: { options: ["test", "quiz", "exam", "lesson", "paper"], answerMap: { "blank_1": "test", "blank_2": "exam" } }
  },
  FIBRW: {
    title: "Fill in the Blanks RW", instruction: "Select the appropriate answer choice for each blank.", promptText: "Dropdown", difficulty: "hard", tags: ["FIBRW"],
    taskCode: "FIBRW", passageText: "This is a [[blank_1]] and [[blank_2]].", taskPayload: { optionSets: { "blank_1": ["A", "B", "C", "D"], "blank_2": ["E", "F", "G", "H"] }, answerMap: { "blank_1": "B", "blank_2": "E" } }
  },
  SST: {
    title: "Summarize Spoken Text", instruction: "Write a summary for a fellow student who was not present.", promptText: "Summarize", difficulty: "hard", tags: ["SST"], sampleAnswer: "Sample summary...",
    taskCode: "SST", taskPayload: { lectureScript: "Full script...", keyPoints: ["point 1"] }
  },
  MCMSL: {
    title: "Multiple Choice Audio Multiple", instruction: "Listen to the recording and answer the question by selecting all the correct responses.", promptText: "Multiple answers", difficulty: "medium", tags: ["MCMSL"],
    taskCode: "MCMSL", taskPayload: { audioScript: "Audio script...", options: ["A", "B", "C", "D"], correctAnswers: ["A", "D"] }
  },
  FIBL: {
    title: "Fill in the Blanks Listening", instruction: "Type the missing words in each blank.", promptText: "Type missing words", difficulty: "medium", tags: ["FIBL"],
    taskCode: "FIBL", taskPayload: { audioScript: "This is the full text.", displayedBlanks: "This is the [[blank_1]] text.", answerMap: { "blank_1": "full" } }
  },
  HCS: {
    title: "Highlight Correct Summary", instruction: "Click on the paragraph that best relates to the recording.", promptText: "Select summary", difficulty: "hard", tags: ["HCS"],
    taskCode: "HCS", taskPayload: { audioScript: "Audio script...", summaryOptions: ["Sum 1", "Sum 2", "Sum 3", "Sum 4"], correctSummary: "Sum 2" }
  },
  MCSSL: {
    title: "Multiple Choice Audio Single", instruction: "Listen to the recording and answer the multiple-choice question by selecting the correct response.", promptText: "Single answer", difficulty: "medium", tags: ["MCSSL"],
    taskCode: "MCSSL", taskPayload: { audioScript: "Audio script...", options: ["A", "B", "C", "D"], correctAnswer: "C" }
  },
  SMW: {
    title: "Select Missing Word", instruction: "Select the correct option to complete the recording.", promptText: "Missing word", difficulty: "medium", tags: ["SMW"],
    taskCode: "SMW", taskPayload: { audioScript: "The end is a BEEP", missingWordLocation: "end", options: ["A", "B", "C", "D"], correctAnswer: "D" }
  },
  HIW: {
    title: "Highlight Incorrect Words", instruction: "Click on the words that are different.", promptText: "Incorrect words", difficulty: "medium", tags: ["HIW"],
    taskCode: "HIW", taskPayload: { correctTranscript: "The quick brown fox", alteredDisplayTranscript: "The fast brown box", mismatchIndexes: [1, 3] }
  },
  WFD: {
    title: "Write from Dictation", instruction: "Type the sentence in the box below exactly as you hear it.", promptText: "Dictation", difficulty: "medium", tags: ["WFD"],
    taskCode: "WFD", taskPayload: { dictationSentence: "The exact sentence here.", canonicalTranscript: "The exact sentence here." }
  }
};

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
  const guidelines = TASK_GUIDELINES[taskCode] || "Follow standard PTE guidelines.";
  const jsonTemplate = TASK_TEMPLATES[taskCode] || {};
  return `
You are a rigorous, highly-paid curriculum designer for Pearson Test of English (PTE) Academic.
Your task is to generate exactly ${count} high-quality, completely original practice question(s) for the task type: ${taskDef.name} (${taskCode}).

STRICT TASK GUIDELINES FOR ${taskCode}:
${guidelines}

GLOBAL CONSTRAINTS:
1. Content MUST be completely original. Do not copy known online practice questions.
2. Use authentic Australian, British, or American academic English consistently.
3. Keep the vocabulary appropriate for the requested difficulty (${difficulty}).
4. Ensure the topic is highly relevant to university lectures, campus life, or professional settings.
5. ${topic ? `Target Topic/Domain: ${topic}` : 'Keep the questions topically varied.'}
6. DO NOT use HTML tags (like <b>, <i>, <p>). Use plain text ONLY.
7. DO NOT use placeholders like [insert text]. Provide actual content.

JSON SCHEMA REQUIREMENT:
You MUST return ONLY a JSON object containing a "questions" array. Do not wrap it in markdown, do not include conversational filler.
The output MUST strictly match the following JSON structure exactly (replace placeholder values with your generated content):

{
  "questions": [
    ${JSON.stringify(jsonTemplate, null, 4)}
  ]
}

Ensure all required properties like 'title', 'instruction', 'promptText', 'difficulty', 'tags', and the specific 'taskPayload' fields are fully populated according to the template above. Failure to do so will break the application.
`;
}
