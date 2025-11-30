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
}
