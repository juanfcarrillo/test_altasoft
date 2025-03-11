export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: number;
  role: MessageRole;
  content: string;
  codeSnippet?: string;
  links?: string[];
  timestamp: Date;
}

export interface Chat {
  id: number;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
