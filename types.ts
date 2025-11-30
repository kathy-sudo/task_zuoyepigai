export interface GradingBreakdown {
  understanding: number;
  logic: number;
  completeness: number;
}

export interface GradingResult {
  score: number;
  summary: string;
  feedback: string;
  breakdown: GradingBreakdown;
}

export interface HistoryItem extends GradingResult {
  id: string;
  timestamp: number;
  snippet: string;
  fileName?: string;
  studentName?: string;
  studentId?: string;
}

export interface SubmissionContent {
  type: 'text' | 'file';
  mimeType: string;
  data: string; // base64 for files, plain text for text/docx
}

export interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  studentName: string;
  studentId: string;
  result?: GradingResult;
  error?: string;
}