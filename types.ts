export enum LessonLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
}

export interface LessonTopic {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  level: LessonLevel;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum AppView {
  HOME = 'HOME',
  LESSON = 'LESSON',
}

export interface LessonState {
  topicId: string | null;
  content: string;
  isLoading: boolean;
}
