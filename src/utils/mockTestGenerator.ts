import { prisma } from '../server/db';
import { logger } from '../server/logger';
import crypto from 'crypto';

export interface GeneratedMockQuestion {
  id: string;
  questionId: string;
  questionBankItemId?: string;
  taskCode: string;
  section: string;
  title: string;
  instruction: string;
  promptText: string;
  promptHtml?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  passageText?: string | null;
  optionsJson?: string | null;
  difficulty: string;
  source: 'cms' | 'fallback';
}

export interface GeneratedMockTest {
  id: string;
  title: string;
  type: 'mini' | 'section' | 'full';
  duration: number;
  questionsCount: number;
  section: string;
  difficulty: string;
  questions: GeneratedMockQuestion[];
}

const MINI_STRUCTURE: { count: number; taskCode: string; section: string }[] = [
  { count: 2, taskCode: 'RA', section: 'Speaking' },
  { count: 2, taskCode: 'RS', section: 'Speaking' },
  { count: 1, taskCode: 'DI', section: 'Speaking' },
  { count: 1, taskCode: 'SWT', section: 'Writing' },
  { count: 1, taskCode: 'WE', section: 'Writing' },
  { count: 1, taskCode: 'ROP', section: 'Reading' },
  { count: 1, taskCode: 'FIBR', section: 'Reading' },
  { count: 1, taskCode: 'SST', section: 'Listening' },
];

const SECTION_STRUCTURES: Record<string, { count: number; taskCode: string }[]> = {
  Speaking: [
    { count: 6, taskCode: 'RA' }, { count: 10, taskCode: 'RS' },
    { count: 3, taskCode: 'DI' }, { count: 2, taskCode: 'RL' },
    { count: 5, taskCode: 'ASQ' },
  ],
  Writing: [
    { count: 2, taskCode: 'SWT' }, { count: 2, taskCode: 'WE' },
  ],
  Reading: [
    { count: 2, taskCode: 'MCS' }, { count: 2, taskCode: 'MCM' },
    { count: 3, taskCode: 'ROP' }, { count: 4, taskCode: 'FIBR' },
    { count: 5, taskCode: 'FIBRW' },
  ],
  Listening: [
    { count: 2, taskCode: 'SST' }, { count: 2, taskCode: 'MCMSL' },
    { count: 3, taskCode: 'FIBL' }, { count: 2, taskCode: 'HCS' },
    { count: 2, taskCode: 'MCSSL' }, { count: 2, taskCode: 'SMW' },
    { count: 2, taskCode: 'HIW' }, { count: 3, taskCode: 'WFD' },
  ],
};

const FULL_STRUCTURE: { count: number; taskCode: string; section: string }[] = [
  { count: 6, taskCode: 'RA', section: 'Speaking' },
  { count: 10, taskCode: 'RS', section: 'Speaking' },
  { count: 3, taskCode: 'DI', section: 'Speaking' },
  { count: 2, taskCode: 'RL', section: 'Speaking' },
  { count: 5, taskCode: 'ASQ', section: 'Speaking' },
  { count: 2, taskCode: 'SWT', section: 'Writing' },
  { count: 2, taskCode: 'WE', section: 'Writing' },
  { count: 2, taskCode: 'MCS', section: 'Reading' },
  { count: 2, taskCode: 'MCM', section: 'Reading' },
  { count: 3, taskCode: 'ROP', section: 'Reading' },
  { count: 4, taskCode: 'FIBR', section: 'Reading' },
  { count: 5, taskCode: 'FIBRW', section: 'Reading' },
  { count: 2, taskCode: 'SST', section: 'Listening' },
  { count: 2, taskCode: 'MCMSL', section: 'Listening' },
  { count: 3, taskCode: 'FIBL', section: 'Listening' },
  { count: 2, taskCode: 'HCS', section: 'Listening' },
  { count: 2, taskCode: 'MCSSL', section: 'Listening' },
  { count: 2, taskCode: 'SMW', section: 'Listening' },
  { count: 2, taskCode: 'HIW', section: 'Listening' },
  { count: 3, taskCode: 'WFD', section: 'Listening' },
];

function getStructure(type: 'mini' | 'section' | 'full', sectionFocus?: string) {
  if (type === 'full') return FULL_STRUCTURE;
  if (type === 'section' && sectionFocus && SECTION_STRUCTURES[sectionFocus]) {
    return SECTION_STRUCTURES[sectionFocus].map(s => ({ ...s, section: sectionFocus }));
  }
  return MINI_STRUCTURE;
}

function estimateDuration(questions: GeneratedMockQuestion[]): number {
  const perQuestion = 2;
  return Math.max(15, Math.ceil((questions.length * perQuestion) / 15) * 15);
}

export async function generateMockTest(
  type: 'mini' | 'section' | 'full',
  sectionFocus?: string
): Promise<GeneratedMockTest> {
  const structure = getStructure(type, sectionFocus);
  const questions: GeneratedMockQuestion[] = [];

  for (const spec of structure) {
    let totalAvailable = 0;
    try {
      totalAvailable = await prisma.questionBankItem.count({
        where: { taskCode: spec.taskCode, status: 'published' },
      });
    } catch { /* count failed, fall back */ }

    for (let i = 0; i < spec.count; i++) {
      if (totalAvailable === 0) {
        const uniqueId = crypto.randomUUID();
        questions.push({
          id: uniqueId,
          questionId: uniqueId,
          taskCode: spec.taskCode,
          section: spec.section,
          title: `[Fallback] ${spec.taskCode}`,
          instruction: `Complete the ${spec.taskCode} task.`,
          promptText: `Fallback: no published CMS questions available for ${spec.taskCode}.`,
          difficulty: 'medium',
          source: 'fallback',
        });
        continue;
      }
      try {
        const item = await prisma.questionBankItem.findFirst({
          where: { taskCode: spec.taskCode, status: 'published' },
          orderBy: { updatedAt: 'desc' },
          skip: i % totalAvailable,
        });
        if (item) {
          const uniqueId = crypto.randomUUID();
          questions.push({
            id: uniqueId,
            questionId: uniqueId,
            questionBankItemId: item.id,
            taskCode: item.taskCode,
            section: item.section,
            title: item.title,
            instruction: item.instruction,
            promptText: item.promptText,
            promptHtml: item.promptHtml,
            audioUrl: item.audioUrl,
            imageUrl: item.imageUrl,
            passageText: item.passageText,
            optionsJson: item.optionsJson,
            difficulty: item.difficulty,
            source: 'cms',
          });
        } else {
          const uniqueId = crypto.randomUUID();
          questions.push({
            id: uniqueId,
            questionId: uniqueId,
            taskCode: spec.taskCode,
            section: spec.section,
            title: `[Fallback] ${spec.taskCode}`,
            instruction: `Complete the ${spec.taskCode} task.`,
            promptText: `Fallback: no published CMS questions available for ${spec.taskCode}. Add content via Admin → Question Bank.`,
            difficulty: 'medium',
            source: 'fallback',
          });
        }
      } catch {
        const uniqueId = crypto.randomUUID();
        questions.push({
          id: uniqueId,
          questionId: uniqueId,
          taskCode: spec.taskCode,
          section: spec.section,
          title: `[Fallback] ${spec.taskCode}`,
          instruction: `Complete the ${spec.taskCode} task.`,
          promptText: `Fallback: CMS query error for ${spec.taskCode}.`,
          difficulty: 'medium',
          source: 'fallback',
        });
      }
    }
  }

  const sectionLabel = type === 'section' && sectionFocus
    ? sectionFocus : type === 'full' ? 'Complete Exam' : 'All Sections Mixed';

  return {
    id: `mock-${type}-${sectionFocus || 'all'}-${Date.now()}`,
    title: type === 'full' ? 'Full Mock Exam' : type === 'section' ? `${sectionFocus} Section Test` : 'Mini Mock Test',
    type,
    duration: estimateDuration(questions),
    questionsCount: questions.length,
    section: sectionLabel,
    difficulty: 'Medium',
    questions,
  };
}
