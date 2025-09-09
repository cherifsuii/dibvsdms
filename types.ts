export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  error?: boolean;
  originalQuery?: string;
  feedback?: 'up' | 'down';
  feedbackSubmitted?: boolean;
  source?: string;
}
