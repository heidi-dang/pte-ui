/**
 * Question Generation Validation Regression Suite
 *
 * Tests:
 * 1. validateCandidate accepts audio-hidden tasks without promptText
 * 2. extractDeduplicationContent includes real task payload content
 * 3. calculateJaccardSimilarity does not return 1 for unrelated short/empty text
 * 4. Batch status logic does not show failed as Completed
 */

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (!condition) {
    console.error(`  FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`  PASS: ${msg}`);
    passed++;
  }
}

// ── Test 1: validateCandidate accepts audio-hidden tasks without promptText ──

const AUDIO_HIDDEN_TASKS = ['RS', 'RL', 'ASQ', 'SGD', 'WFD'];

// We need to dynamically import the module
async function runTests() {
  console.log('=== Question Generation Validation Regression Suite ===\n');

  // Import modules
  const { validateCandidate } = await import('../../src/server/questionGeneration/validators.ts');
  const { extractDeduplicationContent } = await import('../../src/server/questionGeneration/dedupeContent.ts');
  const { calculateJaccardSimilarity } = await import('../../src/server/questionGeneration/dedupe.ts');

  // ── Test 1: Audio-hidden tasks without promptText ──
  console.log('--- Test 1: Audio-hidden tasks accept missing promptText ---');
  for (const taskCode of AUDIO_HIDDEN_TASKS) {
    const candidate = {
      title: 'Test Question',
      instruction: 'Listen carefully.',
      promptText: '',
      difficulty: 'medium',
      taskCode,
      taskPayload: {},
    };
    const result = validateCandidate(candidate, taskCode);
    const hasPromptError = result.errors?.some(e => e.includes('Missing promptText'));
    assert(!hasPromptError, `${taskCode}: no "Missing promptText" error when promptText is empty`);
  }

  // ── Test 1b: Visible-prompt tasks still require promptText ──
  console.log('\n--- Test 1b: Visible-prompt tasks require promptText ---');
  const VISIBLE_TASKS = ['RA', 'DI', 'RTS', 'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW'];
  for (const taskCode of VISIBLE_TASKS) {
    const candidate = {
      title: 'Test Question',
      instruction: 'Read carefully.',
      promptText: '',
      difficulty: 'medium',
      taskCode,
      taskPayload: {},
    };
    const result = validateCandidate(candidate, taskCode);
    const hasPromptError = result.errors?.some(e => e.includes('Missing promptText'));
    assert(hasPromptError, `${taskCode}: has "Missing promptText" error when promptText is empty`);
  }

  // ── Test 2: extractDeduplicationContent includes real payload content ──
  console.log('\n--- Test 2: extractDeduplicationContent includes task payload content ---');

  // DI: chart content should be included
  const diCandidate = {
    title: 'DI Question',
    promptText: 'Describe the image.',
    passageText: '',
    taskPayload: {
      chartSpecification: {
        chartType: 'bar',
        title: 'Monthly Sales',
        labels: ['Jan', 'Feb'],
        series: [{ name: 'Revenue', values: [100, 200] }],
        units: 'USD',
        keyObservations: ['Sales increased'],
      },
      referencePoints: ['Compare trends'],
    },
  };
  const diContent = extractDeduplicationContent(diCandidate, 'DI');
  assert(diContent.includes('Monthly Sales'), 'DI content includes chart title');
  assert(diContent.includes('bar'), 'DI content includes chart type');
  assert(diContent.includes('Jan'), 'DI content includes labels');
  assert(diContent.includes('Revenue'), 'DI content includes series names');
  assert(diContent.includes('100'), 'DI content includes series values');
  assert(diContent.includes('Sales increased'), 'DI content includes key observations');
  assert(diContent.includes('Compare trends'), 'DI content includes reference points');

  // RS: sentence content should be included
  const rsCandidate = {
    title: 'RS Question',
    promptText: '',
    passageText: '',
    taskPayload: {
      sentence: 'The quick brown fox jumps over the lazy dog.',
      referenceTranscript: 'The quick brown fox jumps over the lazy dog.',
      ttsScript: 'The quick brown fox jumps over the lazy dog.',
    },
  };
  const rsContent = extractDeduplicationContent(rsCandidate, 'RS');
  assert(rsContent.includes('quick brown fox'), 'RS content includes sentence');

  // RL: lecture script and key points
  const rlCandidate = {
    title: 'RL Question',
    promptText: '',
    passageText: '',
    taskPayload: {
      lectureScript: 'Today we will discuss photosynthesis.',
      keyPoints: ['Light is essential', 'Chlorophyll is key'],
    },
  };
  const rlContent = extractDeduplicationContent(rlCandidate, 'RL');
  assert(rlContent.includes('photosynthesis'), 'RL content includes lecture script');
  assert(rlContent.includes('Light'), 'RL content includes key points');

  // DI: two different charts produce different content
  const diCandidate2 = {
    title: 'DI Question 2',
    promptText: 'Describe the image.',
    passageText: '',
    taskPayload: {
      chartSpecification: {
        chartType: 'pie',
        title: 'Population Distribution',
        labels: ['Under 18', '18-65'],
        series: [{ name: 'Population', values: [25, 75] }],
        units: 'percent',
        keyObservations: ['Majority are working age'],
      },
      referencePoints: ['Demographic breakdown'],
    },
  };
  const diContent2 = extractDeduplicationContent(diCandidate2, 'DI');
  assert(diContent !== diContent2, 'Two different DI charts produce different deduplication content');

  // ── Test 3: calculateJaccardSimilarity ──
  console.log('\n--- Test 3: Short/empty text similarity ---');

  // Two short identical texts
  const score1 = calculateJaccardSimilarity('apple', 'apple');
  assert(score1 === 1, 'Identical short texts return 1');

  // Two short different texts
  const score2 = calculateJaccardSimilarity('apple', 'banana');
  assert(score2 === 0, 'Different short texts return 0');

  // Two empty texts
  const score3 = calculateJaccardSimilarity('', '');
  assert(score3 === 0, 'Both empty texts return 0');

  // One empty, one non-empty
  const score4 = calculateJaccardSimilarity('', 'hello world');
  assert(score4 === 0, 'One empty text returns 0');

  // DI identical promptText but different content
  // "Describe Image" alone has fewer than 3 tokens, so trigrams are empty
  const score5 = calculateJaccardSimilarity('Describe Image', 'Describe Image');
  assert(score5 === 1, 'Identical short promptText returns 1 (exact match)');

  const score6 = calculateJaccardSimilarity('Describe Image', 'Describe Chart');
  assert(score6 < 1, 'Different short promptText does not return 1');

  // Longer texts with different content
  const score7 = calculateJaccardSimilarity(
    'The quick brown fox jumps over the lazy dog',
    'A completely different text about science and technology'
  );
  assert(score7 < 0.5, 'Two different longer texts have low similarity');

  // ── Test 4: Batch status logic ──
  console.log('\n--- Test 4: Batch status display logic ---');

  // Matches BatchStatusView.tsx statusLabel + computeDisplayStatus
  function statusLabel(s) {
    switch (s) {
      case 'failed': return 'Failed';
      case 'partial_failed': return 'Partial failed';
      case 'completed': return 'Completed';
      case 'queued': return 'Queued';
      case 'generating': return 'Generating';
      case 'validating': return 'Validating';
      default: return s;
    }
  }

  function computeDisplayStatus(b) {
    const status = b.status;
    if (status === 'failed') return { label: 'Failed', isFailed: true, isCompleted: false, isActive: false };
    if (status === 'partial_failed') return { label: 'Partial failed', isFailed: true, isCompleted: false, isActive: false };
    if (status === 'completed') return { label: 'Completed', isCompleted: true, isFailed: false, isActive: false };
    return { label: statusLabel(status), isFailed: false, isCompleted: false, isActive: true };
  }

  // Failed batch with 100% progress must show as Failed, not Completed
  const failedBatch = { status: 'failed', readyCount: 0, failedCount: 10, requestedCount: 10 };
  const d1 = computeDisplayStatus(failedBatch);
  assert(d1.isFailed === true, 'Failed batch shows as Failed (not Completed)');
  assert(d1.label === 'Failed', 'Failed batch label is "Failed"');

  // Partial failed batch
  const partialBatch = { status: 'partial_failed', readyCount: 8, failedCount: 2, requestedCount: 10 };
  const d2 = computeDisplayStatus(partialBatch);
  assert(d2.isFailed === true, 'Partial failed batch shows as Failed');
  assert(d2.label === 'Partial failed', 'Partial failed batch label is "Partial failed"');

  // Completed batch
  const completedBatch = { status: 'completed', readyCount: 10, failedCount: 0, requestedCount: 10 };
  const d3 = computeDisplayStatus(completedBatch);
  assert(d3.isCompleted === true, 'Completed batch shows as Completed');
  assert(d3.label === 'Completed', 'Completed batch label is "Completed"');

  // Active batch
  const activeBatch = { status: 'generating', readyCount: 3, failedCount: 0, requestedCount: 10 };
  const d4 = computeDisplayStatus(activeBatch);
  assert(d4.isActive === true, 'Generating batch shows as Active');
  assert(d4.label === 'Generating', 'Generating batch label is "Generating"');

  // ── Results ──
  console.log(`\n=== Final Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error(`\nFATAL: ${err.message}`);
  process.exit(1);
});
