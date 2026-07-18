import crypto from 'crypto';
import { prisma } from '../db';
import { TaskCode } from '../../shared/questionTaskRegistry';

export function calculateExactHash(taskCode: TaskCode, coreText: string): string {
  const normalized = coreText.toLowerCase().replace(/[^a-z0-9]/g, '');
  return crypto.createHash('sha256').update(`${taskCode}:${normalized}`).digest('hex');
}

function getTrigrams(text: string): Set<string> {
  const t = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = t.split(' ');
  const trigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 2; i++) {
    trigrams.add(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  return trigrams;
}

export function calculateJaccardSimilarity(text1: string, text2: string): number {
  const set1 = getTrigrams(text1);
  const set2 = getTrigrams(text2);
  
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }
  
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

export async function checkDuplicate(taskCode: TaskCode, coreText: string, threshold = 0.82): Promise<{ isDuplicate: boolean; score?: number; matchedId?: string; hash: string }> {
  const hash = calculateExactHash(taskCode, coreText);
  
  // 1. Exact match check (hash)
  const exactMatch = await prisma.questionBankItem.findFirst({
    where: { taskCode, contentHash: hash }
  });
  if (exactMatch) {
    return { isDuplicate: true, score: 1.0, matchedId: exactMatch.id, hash };
  }

  // 2. Near-duplicate check
  // Pull existing texts for this task (limit for performance, or use db-level search in production)
  const existing = await prisma.questionBankItem.findMany({
    where: { taskCode },
    select: { id: true, promptText: true, passageText: true },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  for (const item of existing) {
    const compareText = (item.promptText || '') + ' ' + (item.passageText || '');
    const score = calculateJaccardSimilarity(coreText, compareText);
    if (score >= threshold) {
      return { isDuplicate: true, score, matchedId: item.id, hash };
    }
  }

  return { isDuplicate: false, hash };
}
