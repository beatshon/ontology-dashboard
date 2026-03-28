export type AreaKey =
  | "나"
  | "일"
  | "관계"
  | "배움"
  | "건강"
  | "가족"
  | "경제적 자유"
  | "이룸";

export interface AreaConfig {
  key: AreaKey;
  label: string;
  emoji: string;
  color: string;
  dbEnvKey: string;
}

export interface NotionRecord {
  id: string;
  title: string;
  content?: string;
  date?: string;
  category?: string;
  createdAt: string;
}

export interface Achievement extends NotionRecord {
  size?: "소 (일상적 완료)" | "중 (의미 있는 성취)" | "대 (인생 이정표)";
  area?: string;
  points?: number;
}

export interface AreaData {
  area: AreaConfig;
  records: NotionRecord[];
  total: number;
}

export interface DashboardData {
  areas: AreaData[];
  achievements: Achievement[];
  stats: { area: string; emoji: string; count: number; color: string }[];
}

export interface SentimentRecord {
  date: string;
  label: "긍정" | "부정" | "중립";
  intensity: number;
  emotion: string;
  area: string;
  title: string;
}

export interface RelationNode {
  name: string;
  count: number;
  lastContact: string;
  strengthScore: number;   // 0.0~1.0 관계 강도
  avgSentiment: number;    // -1.0~1.0 감정 평균
  category?: string;       // 동료/가족/친구/멘토/클라이언트
  isDrifting: boolean;     // 드리프트 경고
}

export interface AchievementTrend {
  week: string;
  points: number;
  count: number;
}
