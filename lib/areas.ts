import type { AreaConfig } from "@/types";

export const AREAS: AreaConfig[] = [
  { key: "나", label: "나 (Me)", emoji: "🌱", color: "#4ade80", dbEnvKey: "NOTION_NA_DB_ID" },
  { key: "일", label: "일 (Work)", emoji: "💼", color: "#60a5fa", dbEnvKey: "NOTION_IL_DB_ID" },
  { key: "관계", label: "관계 (People)", emoji: "🤝", color: "#f472b6", dbEnvKey: "NOTION_GWANGYE_DB_ID" },
  { key: "배움", label: "배움 (Learn)", emoji: "📚", color: "#a78bfa", dbEnvKey: "NOTION_BAEUM_DB_ID" },
  { key: "건강", label: "건강 (Health)", emoji: "🏃", color: "#fb923c", dbEnvKey: "NOTION_GEONGANG_DB_ID" },
  { key: "가족", label: "가족 (Family)", emoji: "🏡", color: "#f9a8d4", dbEnvKey: "NOTION_GAJOK_DB_ID" },
  { key: "경제적 자유", label: "경제적 자유 (Finance)", emoji: "💰", color: "#fbbf24", dbEnvKey: "NOTION_GYEONGJE_DB_ID" },
];
