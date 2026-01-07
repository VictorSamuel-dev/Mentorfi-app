import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import type { BadgeDisplay } from "@shared/schema";

interface BadgeIconVariants {
  pillDark?: string;
  pillLight?: string;
  compact?: string;
  iconOnly?: string;
}

interface UserBadgeProps {
  badge: BadgeDisplay;
  variant?: "pill" | "compact" | "icon";
  className?: string;
}

function parseIconVariants(iconSvg: string | null | undefined): BadgeIconVariants | null {
  if (!iconSvg) return null;
  try {
    return JSON.parse(iconSvg);
  } catch {
    return null;
  }
}

export function UserBadge({ badge, variant = "pill", className }: UserBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const iconVariants = parseIconVariants(badge.iconSvg);
  
  const getSvgForVariant = (): string | null => {
    if (!iconVariants) {
      return badge.iconSvg || null;
    }
    
    switch (variant) {
      case "pill":
        return isDark ? iconVariants.pillDark || null : iconVariants.pillLight || iconVariants.pillDark || null;
      case "compact":
        return iconVariants.compact || null;
      case "icon":
        return iconVariants.iconOnly || null;
      default:
        return null;
    }
  };

  const svg = getSvgForVariant();
  
  if (svg && (variant === "pill" || iconVariants)) {
    const isPillSvg = svg.includes('viewBox="0 0 1') && (svg.includes('text') || variant !== "icon");
    
    if (isPillSvg && variant !== "icon") {
      return (
        <span
          className={cn("inline-flex", className)}
          dangerouslySetInnerHTML={{ __html: svg }}
          data-testid={`badge-${badge.code.toLowerCase()}`}
        />
      );
    }
  }
  
  const baseStyles = "inline-flex items-center gap-1 font-semibold rounded-md transition-colors";
  
  const variantStyles = {
    pill: "px-2.5 py-0.5 text-xs border",
    compact: "px-1.5 py-0.5 text-[10px] border",
    icon: "p-1 border rounded-full",
  };

  const style = {
    color: badge.textColor,
    backgroundColor: badge.bgColor,
    borderColor: badge.borderColor,
  };

  const iconSvg = iconVariants?.iconOnly || badge.iconSvg;

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
      data-testid={`badge-${badge.code.toLowerCase()}`}
    >
      {iconSvg && (
        <span
          className={cn(
            "flex-shrink-0",
            variant === "icon" ? "w-3 h-3" : "w-3 h-3"
          )}
          dangerouslySetInnerHTML={{ __html: iconSvg }}
        />
      )}
      {variant !== "icon" && (
        <span>{variant === "compact" ? badge.name.split(" ")[0] : badge.name}</span>
      )}
    </div>
  );
}

interface BadgeRowProps {
  badges: BadgeDisplay[];
  variant?: "pill" | "compact" | "icon";
  className?: string;
  maxDisplay?: number;
}

export function BadgeRow({ 
  badges, 
  variant = "pill", 
  className,
  maxDisplay = 3
}: BadgeRowProps) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)} data-testid="badge-row">
      {displayBadges.map((badge) => (
        <UserBadge key={badge.id} badge={badge} variant={variant} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

export function FoundingMentorBadge({ variant = "pill" }: { variant?: "pill" | "compact" | "icon" }) {
  const badge: BadgeDisplay = {
    id: 1,
    code: "FOUNDING_MENTOR",
    name: "Founding Mentor",
    tier: "special",
    textColor: "#FBBF24",
    bgColor: "#0B1220",
    borderColor: "#FBBF24",
    iconSvg: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1L10 5.5L15 6L11.5 9.5L12.5 14.5L8 12L3.5 14.5L4.5 9.5L1 6L6 5.5L8 1Z" fill="#FBBF24"/></svg>`,
  };

  return <UserBadge badge={badge} variant={variant} />;
}

export function VerifiedMentorBadge({ variant = "pill" }: { variant?: "pill" | "compact" | "icon" }) {
  const badge: BadgeDisplay = {
    id: 2,
    code: "VERIFIED_MENTOR",
    name: "Verified Mentor",
    tier: "trust",
    textColor: "#3B82F6",
    bgColor: "#0B1220",
    borderColor: "#3B82F6",
    iconSvg: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 0L10 3L13.5 2L12.5 5.5L16 7L12.5 8.5L13.5 12L10 11L8 14L6 11L2.5 12L3.5 8.5L0 7L3.5 5.5L2.5 2L6 3L8 0Z" fill="#3B82F6"/><path d="M6 8L7.5 9.5L10 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  return <UserBadge badge={badge} variant={variant} />;
}
