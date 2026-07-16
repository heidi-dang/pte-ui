/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'guest' | 'student' | 'teacher' | 'admin';

export type PTESection = 'Speaking' | 'Writing' | 'Reading' | 'Listening';

export type PTETaskCode =
  | 'RA' // Read Aloud
  | 'RS' // Repeat Sentence
  | 'DI' // Describe Image
  | 'RL' // Retell Lecture
  | 'ASQ' // Answer Short Question
  | 'SGD' // Summarize Group Discussion
  | 'RTS' // Respond to a Situation
  | 'SWT' // Summarize Written Text
  | 'WE' // Write Essay
  | 'MCS' // Multiple Choice, Single Answer (Reading)
  | 'MCM' // Multiple Choice, Multiple Answers (Reading)
  | 'ROP' // Re-order Paragraphs
  | 'FIBR' // Reading: Fill in the Blanks
  | 'FIBRW' // Reading & Writing: Fill in the Blanks
  | 'SST' // Summarize Spoken Text
  | 'MCMSL' // Multiple Choice, Multiple Answers (Listening)
  | 'FIBL' // Listening: Fill in the Blanks
  | 'HCS' // Highlight Correct Summary
  | 'MCSSL' // Multiple Choice, Single Answer (Listening)
  | 'SMW' // Select Missing Word
  | 'HIW' // Highlight Incorrect Words
  | 'WFD'; // Write from Dictation

export interface TaskTypeInfo {
  code: PTETaskCode;
  name: string;
  section: PTESection;
  description: string;
  prepTime: number; // in seconds
  attemptTime: number; // in seconds
}

export interface PracticeItem {
  id: string;
  code: PTETaskCode;
  title: string;
  instruction: string;
  promptText?: string;
  imageUrl?: string;
  audioUrl?: string;
  options?: string[];
  correctAnswer?: string | string[]; // For MCQ, reorder, blanks
  transcript?: string;
  modelAnswer: string;
  templates?: string[];
  tips: string[];
  vocabulary: { phrase: string; meaning: string }[];
}

export interface MockTest {
  id: string;
  title: string;
  type: 'mini' | 'section' | 'full';
  duration: number; // minutes
  questionsCount: number;
  section: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface TestAttempt {
  id: string;
  testId: string;
  title: string;
  type: 'mini' | 'section' | 'full';
  date: string;
  overallScore: number;
  speakingScore: number;
  writingScore: number;
  readingScore: number;
  listeningScore: number;
  status: 'Completed' | 'In Progress' | 'Paused';
}

export interface Submission {
  id: string;
  studentName: string;
  taskTitle: string;
  section: PTESection;
  code: PTETaskCode;
  submittedAt: string;
  status: 'pending' | 'graded';
  answerText?: string;
  audioUrl?: string; // Simulated
  score?: number;
  feedback?: string;
  grammarIssues?: number;
  pronunciationScore?: number;
  fluencyScore?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessonsCount: number;
  progress: number; // percentage
  image: string;
  level: 'Foundation' | 'Intermediate' | 'Target 79+';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  completed: boolean;
  videoUrl?: string;
  content: string;
  grammarRules?: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: 'Vocabulary' | 'Collocations' | 'Idioms' | 'Academic Word List';
  mastered: boolean;
}

export interface StudentProgress {
  overallScore: number;
  targetScore: number;
  streakDays: number;
  lastActive: string;
  skills: {
    speaking: number;
    writing: number;
    reading: number;
    listening: number;
  };
  weeklyActivity: { day: string; hours: number }[];
}
