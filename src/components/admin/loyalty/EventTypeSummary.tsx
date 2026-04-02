import type { LoyaltyRuleResponse } from "../../../types/Loyalty";
import { EVENT_TYPE_COLORS, EVENT_TYPE_ICONS } from "./constants";

interface EventTypeSummaryProps {
  rules: LoyaltyRuleResponse[];
}

export default function EventTypeSummary({ rules }: EventTypeSummaryProps) {
  const eventTypes = [...new Set(rules.map((r) => r.eventType))];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {eventTypes.map((eventType) => {
        const color = EVENT_TYPE_COLORS[eventType];

        return (
          <span
            key={eventType}
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: color.bg,
              color: color.color,
            }}
          >
            {EVENT_TYPE_ICONS[eventType]} {eventType}
          </span>
        );
      })}
    </div>
  );
}
