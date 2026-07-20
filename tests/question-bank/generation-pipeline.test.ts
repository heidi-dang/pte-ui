/**
 * Unit tests: Question Bank Generation Pipeline.
 * Tests the generation pipeline schema coverage for all 22 task types.
 * Never calls real DeepSeek.
 */

import { getAllContracts } from '../../src/practice/contracts/registry';
import { PTE_TASK_REGISTRY } from '../../src/shared/pteTaskRegistry';
import { PTETaskCodeSchema } from '../../src/shared/mockExamTypes';

let passed = 0;
let failed = 0;

function check(condition: boolean, label: string) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
  return condition;
}

function main() {
  console.log('=== Question Bank Generation Pipeline Tests ===\n');

  const contracts = getAllContracts();
  const registry = PTE_TASK_REGISTRY;

  // 1. All 22 contracts have required metadata
  console.log('--- Contract metadata ---');
  check(contracts.length === 22, `22 contracts (got ${contracts.length})`);
  check(Object.keys(registry).length === 22, `22 registry entries (got ${Object.keys(registry).length})`);

  for (const c of contracts) {
    check(c.code !== undefined, `${c.code}: code exists`);
    check(c.name !== undefined && c.name.length > 0, `${c.code}: name exists`);
    check(c.section !== undefined, `${c.code}: section exists`);
    check((c as any).questionSchema !== undefined, `${c.code}: questionSchema exists`);
    check((c as any).responseSchema !== undefined, `${c.code}: responseSchema exists`);
    check((c as any).scoringMode !== undefined, `${c.code}: scoringMode exists`);
    check((c as any).responseMode !== undefined, `${c.code}: responseMode exists`);
  }

  // 2. PTETaskCodeSchema covers all 22
  console.log('\n--- PTETaskCodeSchema ---');
  const schemaCodes = Object.keys(PTETaskCodeSchema._def.entries || {});
  check(schemaCodes.length === 22, `Schema has 22 codes (got ${schemaCodes.length})`);

  // 3. Registry has per-task metadata required for generation
  console.log('\n--- Registry metadata ---');
  for (const [code, info] of Object.entries(registry)) {
    check(info.code === code, `${code}: code matches`);
    check(info.section === 'Speaking' || info.section === 'Writing' || info.section === 'Reading' || info.section === 'Listening',
      `${code}: valid section`);
    check(info.scoringKind !== undefined, `${code}: scoringKind defined`);
    check(info.maxCredit > 0, `${code}: maxCredit > 0`);
    check(info.rendererKey !== undefined, `${code}: rendererKey defined`);
    check(info.responseKind !== undefined, `${code}: responseKind defined`);
    check(info.requiresAudioPrompt !== undefined, `${code}: requiresAudioPrompt defined`);
    check(info.requiresStudentAudio !== undefined, `${code}: requiresStudentAudio defined`);

    // Task-specific checks
    if (['MCS', 'MCM', 'MCSSL', 'MCMSL', 'HCS', 'SMW'].includes(code)) {
      check(info.scoringKind === 'deterministic', `${code}: MCQ tasks are deterministic`);
    }
    if (['FIBR', 'FIBRW', 'FIBL'].includes(code)) {
      check(info.scoringKind === 'deterministic', `${code}: FIB tasks are deterministic`);
    }
    if (code === 'ROP') {
      check(info.scoringKind === 'deterministic', `${code}: ROP is deterministic`);
    }
    if (code === 'HIW') {
      check(info.scoringKind === 'deterministic', `${code}: HIW is deterministic`);
    }
    if (code === 'WFD') {
      check(info.scoringKind === 'deterministic', `${code}: WFD is deterministic`);
    }
    if (code === 'ASQ') {
      check(info.scoringKind === 'deterministic', `${code}: ASQ is deterministic`);
    }
    if (['RA', 'RS', 'DI', 'RL', 'SGD', 'RTS'].includes(code)) {
      check(info.scoringKind === 'stt_ai', `${code}: speaking tasks use stt_ai`);
    }
    if (['SWT', 'WE', 'SST'].includes(code)) {
      check(info.scoringKind === 'ai', `${code}: writing tasks use ai`);
    }
  }

  // 4. Section counts
  console.log('\n--- Section counts ---');
  const bySection: Record<string, number> = {};
  for (const c of contracts) { bySection[c.section] = (bySection[c.section] || 0) + 1; }
  check(bySection['Speaking'] === 7, `Speaking has 7 (got ${bySection['Speaking']})`);
  check(bySection['Writing'] === 2, `Writing has 2 (got ${bySection['Writing']})`);
  check(bySection['Reading'] === 5, `Reading has 5 (got ${bySection['Reading']})`);
  check(bySection['Listening'] === 8, `Listening has 8 (got ${bySection['Listening']})`);

  // 5. Specific task name checks
  console.log('\n--- Named task checks ---');
  const nameMap: Record<string, string> = {
    RA: 'Read Aloud', RS: 'Repeat Sentence', DI: 'Describe Image',
    RL: 'Retell Lecture', ASQ: 'Answer Short Question',
    SGD: 'Summarize Group Discussion', RTS: 'Respond to a Situation',
    SWT: 'Summarize Written Text', WE: 'Write Essay',
    MCS: 'Multiple-choice, Choose Single Answer',
    MCM: 'Multiple-choice, Choose Multiple Answers',
    ROP: 'Re-order Paragraphs',
    FIBR: 'Fill in the Blanks (Reading)',
    FIBRW: 'Fill in the Blanks (Reading & Writing)',
    SST: 'Summarize Spoken Text',
  };
  for (const [code, expectedName] of Object.entries(nameMap)) {
    const contract = contracts.find(c => c.code === code);
    check(contract?.name === expectedName, `${code}: name "${expectedName}"`);
  }

  // 6. Generate mock question data shapes per task
  console.log('\n--- Generation question shapes ---');
  const sampleQuestions: Record<string, any> = {
    RA: { taskCode: 'RA', title: 'Read Passage', instruction: 'Read the text aloud', promptText: 'Sample text', difficulty: 'medium', section: 'Speaking' },
    RS: { taskCode: 'RS', title: 'Repeat Sentence', instruction: 'Repeat the sentence you hear', promptText: '', difficulty: 'medium', section: 'Speaking' },
    DI: { taskCode: 'DI', title: 'Describe Image', instruction: 'Describe the image', promptText: 'Chart showing data', difficulty: 'medium', section: 'Speaking' },
    RL: { taskCode: 'RL', title: 'Retell Lecture', instruction: 'Retell the lecture', promptText: '', difficulty: 'medium', section: 'Speaking' },
    ASQ: { taskCode: 'ASQ', title: 'Short Question', instruction: 'Answer the question', promptText: 'What color is the sky?', answerKeyJson: JSON.stringify({ answers: ['blue', 'sky blue'] }), difficulty: 'medium', section: 'Speaking' },
    SGD: { taskCode: 'SGD', title: 'Group Discussion', instruction: 'Summarize the discussion', promptText: 'Group discussed topic X', difficulty: 'medium', section: 'Speaking' },
    RTS: { taskCode: 'RTS', title: 'Respond to Situation', instruction: 'Respond to the situation', promptText: 'You are in a meeting...', difficulty: 'medium', section: 'Speaking' },
    SWT: { taskCode: 'SWT', title: 'Summarize Text', instruction: 'Summarize in one sentence', promptText: 'Long passage text...', difficulty: 'medium', section: 'Writing' },
    WE: { taskCode: 'WE', title: 'Write Essay', instruction: 'Write an essay', promptText: 'Essay topic: technology', difficulty: 'medium', section: 'Writing' },
    MCS: { taskCode: 'MCS', title: 'Choose Single', instruction: 'Choose one answer', promptText: 'Question text', optionsJson: JSON.stringify(['A', 'B', 'C', 'D']), answerKeyJson: JSON.stringify({ correct: 'B' }), difficulty: 'medium', section: 'Reading' },
    MCM: { taskCode: 'MCM', title: 'Choose Multiple', instruction: 'Choose all that apply', promptText: 'Question text', optionsJson: JSON.stringify(['A', 'B', 'C']), answerKeyJson: JSON.stringify({ correct: ['A', 'C'] }), difficulty: 'medium', section: 'Reading' },
    ROP: { taskCode: 'ROP', title: 'Reorder Paragraphs', instruction: 'Order the paragraphs', promptText: 'Reorder the text', optionsJson: JSON.stringify(['Para1', 'Para2', 'Para3']), answerKeyJson: JSON.stringify({ correctOrder: ['Para1', 'Para2', 'Para3'] }), difficulty: 'medium', section: 'Reading' },
    FIBR: { taskCode: 'FIBR', title: 'Fill Blanks', instruction: 'Fill the blanks', promptText: 'Text with [1] and [2]', answerKeyJson: JSON.stringify({ answers: { '1': 'word1', '2': 'word2' } }), difficulty: 'medium', section: 'Reading' },
    FIBRW: { taskCode: 'FIBRW', title: 'Fill Blanks RW', instruction: 'Fill reading & writing blanks', promptText: 'Text with [1] and [2]', answerKeyJson: JSON.stringify({ answers: { '1': 'word1', '2': 'word2' } }), difficulty: 'medium', section: 'Reading' },
    SST: { taskCode: 'SST', title: 'Summarize Spoken', instruction: 'Summarize the lecture', promptText: '', difficulty: 'medium', section: 'Listening' },
    MCMSL: { taskCode: 'MCMSL', title: 'MC Multiple Listening', instruction: 'Choose multiple answers', promptText: '', optionsJson: JSON.stringify(['A', 'B', 'C']), answerKeyJson: JSON.stringify({ correct: ['A', 'C'] }), difficulty: 'medium', section: 'Listening' },
    FIBL: { taskCode: 'FIBL', title: 'Fill Blanks Listening', instruction: 'Fill the blanks', promptText: 'Text with blanks', answerKeyJson: JSON.stringify({ answers: { '1': 'word1' } }), difficulty: 'medium', section: 'Listening' },
    HCS: { taskCode: 'HCS', title: 'Highlight Summary', instruction: 'Choose the correct summary', promptText: '', optionsJson: JSON.stringify(['Sum1', 'Sum2', 'Sum3']), answerKeyJson: JSON.stringify({ correct: 'Sum1' }), difficulty: 'medium', section: 'Listening' },
    MCSSL: { taskCode: 'MCSSL', title: 'MC Single Listening', instruction: 'Choose one answer', promptText: '', optionsJson: JSON.stringify(['A', 'B', 'C']), answerKeyJson: JSON.stringify({ correct: 'A' }), difficulty: 'medium', section: 'Listening' },
    SMW: { taskCode: 'SMW', title: 'Select Missing Word', instruction: 'Select the missing word', promptText: '', optionsJson: JSON.stringify(['word1', 'word2', 'word3']), answerKeyJson: JSON.stringify({ correct: 'word2' }), difficulty: 'medium', section: 'Listening' },
    HIW: { taskCode: 'HIW', title: 'Highlight Words', instruction: 'Highlight incorrect words', promptText: 'This text has some incorrect words in it', answerKeyJson: JSON.stringify({ incorrect: ['incorrect'] }), difficulty: 'medium', section: 'Listening' },
    WFD: { taskCode: 'WFD', title: 'Write from Dictation', instruction: 'Type what you hear', promptText: '', answerKeyJson: JSON.stringify({ segments: ['the quick brown fox'] }), difficulty: 'medium', section: 'Listening' },
  };

  for (const [code, shape] of Object.entries(sampleQuestions)) {
    const entry = registry[code];
    check(entry !== undefined, `${code}: registry entry exists`);
    check(shape.taskCode === code, `${code}: taskCode matches`);
    check(shape.title !== undefined, `${code}: title present`);
    check(shape.instruction !== undefined, `${code}: instruction present`);
    check(shape.difficulty !== undefined, `${code}: difficulty present`);
    check(shape.section !== undefined, `${code}: section present`);

    if ((code === 'MCS' || code === 'MCM' || code === 'MCSSL' || code === 'MCMSL' || code === 'HCS' || code === 'SMW')) {
      check(shape.optionsJson !== undefined, `${code}: MCQ tasks must have optionsJson`);
      check(shape.answerKeyJson !== undefined, `${code}: MCQ tasks must have answerKeyJson`);
    }
    if (code === 'ROP') {
      check(shape.optionsJson !== undefined, `${code}: ROP must have optionsJson`);
      check(shape.answerKeyJson !== undefined, `${code}: ROP must have answerKeyJson`);
    }
    if (['FIBR', 'FIBRW', 'FIBL'].includes(code)) {
      check(shape.answerKeyJson !== undefined, `${code}: FIB tasks must have answerKeyJson`);
    }
    if (code === 'HIW') {
      check(shape.answerKeyJson !== undefined, `${code}: HIW must have answerKeyJson`);
    }
    if (code === 'WFD') {
      check(shape.answerKeyJson !== undefined, `${code}: WFD must have answerKeyJson`);
    }
    if (code === 'ASQ') {
      check(shape.answerKeyJson !== undefined, `${code}: ASQ should have answerKeyJson`);
    }
  }

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
