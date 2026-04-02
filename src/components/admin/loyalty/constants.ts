import type { EventType, TierName } from "../../../types/Loyalty";

export const TIER_NAMES: TierName[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

export const TIER_POINTS: Record<TierName, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1000,
  PLATINUM: 2000,
};

export const TIER_COLORS: Record<TierName, { bg: string; text: string; border: string; badge: string }> = {
  BRONZE: { bg: "#fdf6ee", text: "#92400e", border: "#d97706", badge: "#b45309" },
  SILVER: { bg: "#f8fafc", text: "#334155", border: "#94a3b8", badge: "#64748b" },
  GOLD: { bg: "#fefce8", text: "#854d0e", border: "#eab308", badge: "#ca8a04" },
  PLATINUM: { bg: "#f0f9ff", text: "#0c4a6e", border: "#38bdf8", badge: "#0284c7" },
};

export const EVENT_TYPES: EventType[] = [
  "ORDER",
  "REVIEW",
  "REFERRAL",
  "REDEMPTION",
  "BIRTHDAY",
  "HOLIDAY",
  "SPECIAL",
];

export const EVENT_TYPE_COLORS: Record<EventType, { bg: string; color: string }> = {
  ORDER: { bg: "#fff7ed", color: "#c2410c" },
  REVIEW: { bg: "#f0fdf4", color: "#15803d" },
  REFERRAL: { bg: "#eff6ff", color: "#1d4ed8" },
  REDEMPTION: { bg: "#f0f9ff", color: "#0369a1" },
  BIRTHDAY: { bg: "#fdf4ff", color: "#9333ea" },
  HOLIDAY: { bg: "#fff1f2", color: "#e11d48" },
  SPECIAL: { bg: "#fefce8", color: "#ca8a04" },
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  ORDER: "🛒",
  REVIEW: "⭐",
  REFERRAL: "👥",
  REDEMPTION: "🎁",
  BIRTHDAY: "🎂",
  HOLIDAY: "🎉",
  SPECIAL: "✨",
};

export const NO_DATE_EVENTS: EventType[] = ["ORDER", "REVIEW", "REFERRAL"];
