/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  text: string;
  options: string[];
  answer: number; // Index of the correct answer (0-3)
  explanation: string;
}

export interface Workbook {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: '쉬움' | '보통' | '어려움';
  questions: Question[];
  createdAt: string;
  isCustom: boolean;
  category: 'dirt' | 'stone' | 'wood' | 'gold' | 'diamond';
}

export interface GameProgress {
  workbookId: string;
  currentQuestionIndex: number;
  answers: Record<number, number>; // questionIndex -> selectedIndex
  health: number; // From 0 to 3 (represented by Minecraft hearts ❤️❤️❤️)
  score: number; // XP points (e.g., 100 XP per question)
  isCompleted: boolean;
  isGameOver: boolean;
  isOfflineFallback?: boolean;
}
