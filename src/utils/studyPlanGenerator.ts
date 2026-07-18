import { prisma } from '../server/db';

interface StudyPlanItem {
  type: 'lesson' | 'practice' | 'mock' | 'review' | 'flashcard';
  section: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface StudyPlan {
  dailyTasks: StudyPlanItem[];
  weeklyPlan: { day: string; tasks: StudyPlanItem[] }[];
  weakAreas: { section: string; message: string; suggestedTasks: string[] }[];
  sourceData: { totalSubmissions: number; totalTests: number; completedLessons: number; knownFlashcards: number };
  isFallback: boolean;
  starterPlan?: boolean;
  generatedAt: string;
}

function getSectionScores(submissions: any[]): Record<string, { total: number; count: number }> {
  const sections: Record<string, { total: number; count: number }> = {};
  for (const s of submissions) {
    const sec = s.section || 'Other';
    if (!sections[sec]) sections[sec] = { total: 0, count: 0 };
    if (s.score != null && s.score > 0) {
      sections[sec].total += s.score;
      sections[sec].count++;
    }
  }
  return sections;
}

function buildFallbackPlan(): StudyPlan {
  return {
    dailyTasks: [
      { type: 'lesson', section: 'Speaking', title: 'Introduction to Read Aloud', reason: 'Foundation skill for speaking section', priority: 'high' },
      { type: 'lesson', section: 'Writing', title: 'Essay Structure Basics', reason: 'Foundation for writing section', priority: 'high' },
      { type: 'practice', section: 'Reading', title: 'Read Aloud Practice', reason: 'Build fluency and pronunciation', priority: 'medium' },
      { type: 'review', section: 'Listening', title: 'Review Common Vocabulary', reason: 'Essential for listening comprehension', priority: 'medium' },
    ],
    weeklyPlan: [
      { day: 'Mon', tasks: [{ type: 'lesson', section: 'Speaking', title: 'Speaking Fundamentals', reason: 'Foundation', priority: 'high' }] },
      { day: 'Tue', tasks: [{ type: 'practice', section: 'Writing', title: 'Essay Writing Practice', reason: 'Foundation', priority: 'high' }] },
      { day: 'Wed', tasks: [{ type: 'lesson', section: 'Reading', title: 'Reading Comprehension', reason: 'Foundation', priority: 'medium' }] },
      { day: 'Thu', tasks: [{ type: 'practice', section: 'Listening', title: 'Listening Drills', reason: 'Foundation', priority: 'medium' }] },
      { day: 'Fri', tasks: [{ type: 'review', section: 'All', title: 'Weekly Review', reason: 'Consolidate learning', priority: 'low' }] },
      { day: 'Sat', tasks: [{ type: 'mock', section: 'All', title: 'Mini Mock Test', reason: 'Track progress', priority: 'high' }] },
      { day: 'Sun', tasks: [{ type: 'flashcard', section: 'All', title: 'Flashcard Review', reason: 'Maintain vocabulary', priority: 'low' }] },
    ],
    weakAreas: [
      { section: 'Speaking', message: 'Starter plan — no practice data yet.', suggestedTasks: ['Read Aloud', 'Repeat Sentence', 'Describe Image'] },
      { section: 'Writing', message: 'Starter plan — no practice data yet.', suggestedTasks: ['Summarize Written Text', 'Write Essay'] },
      { section: 'Reading', message: 'Starter plan — no practice data yet.', suggestedTasks: ['Re-order Paragraphs', 'Fill in the Blanks'] },
      { section: 'Listening', message: 'Starter plan — no practice data yet.', suggestedTasks: ['Summarize Spoken Text', 'Write from Dictation'] },
    ],
    sourceData: { totalSubmissions: 0, totalTests: 0, completedLessons: 0, knownFlashcards: 0 },
    isFallback: true,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateStudyPlan(userId: string): Promise<StudyPlan> {
  const [submissions, tests, lessons, flashcards] = await Promise.all([
    prisma.practiceSubmission.findMany({ where: { userId, status: 'graded' }, orderBy: { submittedAt: 'desc' }, take: 50 }),
    prisma.testAttempt.findMany({ where: { userId, status: 'Completed' }, orderBy: { date: 'desc' }, take: 10 }),
    prisma.lessonCompletion.findMany({ where: { userId } }),
    prisma.flashcardState.findMany({ where: { userId, mastered: true } }),
  ]);

  const totalSubmissions = submissions.length;
  const totalTests = tests.length;
  const completedLessons = lessons.length;
  const knownFlashcards = flashcards.length;

  if (totalSubmissions === 0 && totalTests === 0 && completedLessons === 0) {
    return buildFallbackPlan();
  }

  const sectionScores = getSectionScores(submissions);

  // Identify weak areas (sections with lowest average or least activity)
  const weakAreas = ['Speaking', 'Writing', 'Reading', 'Listening'].map(sec => {
    const data = sectionScores[sec] || { total: 0, count: 0 };
    const avg = data.count > 0 ? Math.round(data.total / data.count) : null;
    if (avg === null || avg < 60) {
      return {
        section: sec,
        message: avg === null ? `No scored practice submissions for ${sec} yet.` : `Average score ${avg}/90 — needs improvement.`,
        suggestedTasks: getTasksForSection(sec),
      };
    }
    return {
      section: sec,
      message: `Average score ${avg}/90 — maintaining performance.`,
      suggestedTasks: getTasksForSection(sec),
    };
  });

  // Build daily tasks from practice history weak spots and lesson gaps
  const dailyTasks: StudyPlanItem[] = [];
  const weakSecs = weakAreas.filter(w => w.message.includes('needs improvement') || w.message.includes('No scored'));
  weakSecs.slice(0, 3).forEach(w => {
    dailyTasks.push({ type: 'practice', section: w.section, title: `Practice ${w.suggestedTasks[0]}`, reason: w.message, priority: 'high' });
  });
  if (completedLessons < 10) {
    dailyTasks.push({ type: 'lesson', section: 'All', title: 'Complete Learning Modules', reason: `Only ${completedLessons} lessons completed.`, priority: 'medium' });
  }
  if (totalTests === 0) {
    dailyTasks.push({ type: 'mock', section: 'All', title: 'Take Mini Mock Test', reason: 'No mock tests attempted yet.', priority: 'high' });
  }

  // Build weekly plan
  const weeklyPlan = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    tasks: dailyTasks.slice(i % dailyTasks.length, (i % dailyTasks.length) + 1),
  }));

  return {
    dailyTasks,
    weeklyPlan,
    weakAreas,
    sourceData: { totalSubmissions, totalTests, completedLessons, knownFlashcards },
    isFallback: false,
    generatedAt: new Date().toISOString(),
  };
}

function getTasksForSection(section: string): string[] {
  const map: Record<string, string[]> = {
    Speaking: ['Read Aloud (RA)', 'Repeat Sentence (RS)', 'Describe Image (DI)', 'Retell Lecture (RL)', 'Answer Short Question (ASQ)'],
    Writing: ['Summarize Written Text (SWT)', 'Write Essay (WE)'],
    Reading: ['Re-order Paragraphs (ROP)', 'Fill in the Blanks (FIBR)', 'Fill in the Blanks R&W (FIBRW)', 'Multiple Choice (MCS/MCM)'],
    Listening: ['Summarize Spoken Text (SST)', 'Write from Dictation (WFD)', 'Fill in the Blanks (FIBL)', 'Highlight Incorrect Words (HIW)'],
  };
  return map[section] || ['Mixed practice'];
}
