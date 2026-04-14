import { type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";

interface KPIDetailItem {
  label: string;
  value: string | number;
  changeType?: "positive" | "negative" | "neutral";
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  subtitle?: string;
  href?: string;
  details?: KPIDetailItem[];
  detailTitle?: string;
}

const changeColors = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  subtitle,
  href,
  details,
  detailTitle,
}: KPICardProps) {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const isClickable = href || details;

  const handleClick = () => {
    if (details) {
      setFlipped(true);
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <div style={{ perspective: "800px" }}>
      <div
        className={`relative transition-transform duration-500`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* Front */}
        <div
          className={`glass-card p-5 ${isClickable ? "cursor-pointer hover:border-primary/30 hover:glow-primary transition-all" : ""}`}
          style={{ backfaceVisibility: "hidden" }}
          onClick={isClickable ? handleClick : undefined}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="p-2 rounded-md bg-secondary">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold">{value}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {change && (
              <span className={`text-xs font-medium ${changeColors[changeType]}`}>{change}</span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Back */}
        {details && (
          <div
            className="glass-card p-5 absolute inset-0 overflow-auto"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-foreground truncate">{detailTitle || title}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(false);
                }}
                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-border">
              {details.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      changeColors[item.changeType || "neutral"]
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {href && (
              <button
                className="w-full flex items-center justify-center gap-1 mt-3 pt-2 border-t border-border text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(href);
                }}
              >
                Go to section
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
