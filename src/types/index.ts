export type QuestionType =
  | 'multiple_choice'
  | 'multiple_answer'
  | 'yes_no'
  | 'rating'
  | 'word_cloud';

export type SessionStatus = 'waiting' | 'active' | 'ended';

export interface PollOption {
  id: string;
  text: string;
  order: number;
  questionId: string;
}

export interface PollQuestion {
  id: string;
  sessionId: string;
  text: string;
  type: QuestionType;
  order: number;
  isActive: boolean;
  options: PollOption[];
}

export interface PollSession {
  id: string;
  sessionCode: string;
  title: string;
  status: SessionStatus;
  adminToken?: string;
  bgImage?: string | null;
  questions: PollQuestion[];
  createdAt: string;
}

export interface OptionResult {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface WordEntry {
  word: string;
  count: number;
}

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface QuestionResults {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalVotes: number;
  options?: OptionResult[];
  words?: WordEntry[];
  averageRating?: number;
  ratingDistribution?: RatingBucket[];
  maxRating?: number;
}

// Socket event payloads
export interface PollStartedPayload {
  question: PollQuestion;
  results: QuestionResults;
}

export interface SessionJoinedPayload {
  sessionCode: string;
  status: SessionStatus;
  activeQuestion?: PollQuestion;
  results?: QuestionResults;
}
