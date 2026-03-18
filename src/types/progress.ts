export interface UserProgress {
  id: string;
  user_id: string;
  exercise_id: string;
  is_correct: boolean;
  answer_given: string;
  time_spent_ms: number;
  attempted_at: string;
}

export interface TopicMastery {
  user_id: string;
  topic: string;
  language: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;          // 0.0–1.0
  last_practiced_at: string;
}
