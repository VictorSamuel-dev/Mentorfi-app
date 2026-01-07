export interface BadgeIconVariants {
  pillDark: string;
  pillLight: string;
  compact: string;
  iconOnly: string;
}

export interface BadgeSeedData {
  code: string;
  name: string;
  description: string;
  tier: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconVariants: BadgeIconVariants;
}

const FOUNDING_MENTOR_ICONS: BadgeIconVariants = {
  pillDark: `<svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="24" rx="4" fill="#0B1220"/>
    <rect x="0.5" y="0.5" width="119" height="23" rx="3.5" stroke="#FBBF24" stroke-opacity="0.5"/>
    <path d="M12 4L14 8.5L19 9L15.5 12.5L16.5 17.5L12 15L7.5 17.5L8.5 12.5L5 9L10 8.5L12 4Z" fill="#FBBF24"/>
    <text x="26" y="16" fill="#FBBF24" font-family="system-ui" font-size="11" font-weight="600">Founding Mentor</text>
  </svg>`,
  pillLight: `<svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="24" rx="4" fill="#FFFBEB"/>
    <rect x="0.5" y="0.5" width="119" height="23" rx="3.5" stroke="#D97706" stroke-opacity="0.3"/>
    <path d="M12 4L14 8.5L19 9L15.5 12.5L16.5 17.5L12 15L7.5 17.5L8.5 12.5L5 9L10 8.5L12 4Z" fill="#D97706"/>
    <text x="26" y="16" fill="#92400E" font-family="system-ui" font-size="11" font-weight="600">Founding Mentor</text>
  </svg>`,
  compact: `<svg viewBox="0 0 80 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="18" rx="3" fill="#0B1220"/>
    <rect x="0.5" y="0.5" width="79" height="17" rx="2.5" stroke="#FBBF24" stroke-opacity="0.5"/>
    <path d="M9 3L10.5 6L14 6.3L11.5 8.8L12.2 12.2L9 10.5L5.8 12.2L6.5 8.8L4 6.3L7.5 6L9 3Z" fill="#FBBF24"/>
    <text x="18" y="12.5" fill="#FBBF24" font-family="system-ui" font-size="9" font-weight="600">Founding</text>
  </svg>`,
  iconOnly: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L10 5.5L15 6L11.5 9.5L12.5 14.5L8 12L3.5 14.5L4.5 9.5L1 6L6 5.5L8 1Z" fill="#FBBF24"/>
  </svg>`,
};

const VERIFIED_MENTOR_ICONS: BadgeIconVariants = {
  pillDark: `<svg viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="110" height="24" rx="4" fill="#0B1220"/>
    <rect x="0.5" y="0.5" width="109" height="23" rx="3.5" stroke="#3B82F6" stroke-opacity="0.5"/>
    <path d="M12 3L14 6L17.5 5L16.5 8.5L20 10L16.5 11.5L17.5 15L14 14L12 17L10 14L6.5 15L7.5 11.5L4 10L7.5 8.5L6.5 5L10 6L12 3Z" fill="#3B82F6"/>
    <path d="M10 10L11.5 11.5L14 8.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="26" y="16" fill="#3B82F6" font-family="system-ui" font-size="11" font-weight="600">Verified Mentor</text>
  </svg>`,
  pillLight: `<svg viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="110" height="24" rx="4" fill="#EFF6FF"/>
    <rect x="0.5" y="0.5" width="109" height="23" rx="3.5" stroke="#3B82F6" stroke-opacity="0.3"/>
    <path d="M12 3L14 6L17.5 5L16.5 8.5L20 10L16.5 11.5L17.5 15L14 14L12 17L10 14L6.5 15L7.5 11.5L4 10L7.5 8.5L6.5 5L10 6L12 3Z" fill="#3B82F6"/>
    <path d="M10 10L11.5 11.5L14 8.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="26" y="16" fill="#1D4ED8" font-family="system-ui" font-size="11" font-weight="600">Verified Mentor</text>
  </svg>`,
  compact: `<svg viewBox="0 0 70 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="70" height="18" rx="3" fill="#0B1220"/>
    <rect x="0.5" y="0.5" width="69" height="17" rx="2.5" stroke="#3B82F6" stroke-opacity="0.5"/>
    <path d="M9 2.5L10.5 5L13 4.5L12.3 7L15 8.5L12.3 10L13 12.5L10.5 12L9 14.5L7.5 12L5 12.5L5.7 10L3 8.5L5.7 7L5 4.5L7.5 5L9 2.5Z" fill="#3B82F6"/>
    <path d="M7.5 8.5L8.5 9.5L10.5 7" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="18" y="12.5" fill="#3B82F6" font-family="system-ui" font-size="9" font-weight="600">Verified</text>
  </svg>`,
  iconOnly: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L10 3L13.5 2L12.5 5.5L16 7L12.5 8.5L13.5 12L10 11L8 14L6 11L2.5 12L3.5 8.5L0 7L3.5 5.5L2.5 2L6 3L8 0Z" fill="#3B82F6"/>
    <path d="M6 8L7.5 9.5L10 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

const EARLY_SUPPORTER_ICONS: BadgeIconVariants = {
  pillDark: `<svg viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="110" height="24" rx="4" fill="#0B1220"/>
    <rect x="0.5" y="0.5" width="109" height="23" rx="3.5" stroke="#64748B" stroke-opacity="0.5"/>
    <path d="M12 5C8.69 5 6 7.69 6 11C6 14.31 8.69 17 12 17C15.31 17 18 14.31 18 11C18 7.69 15.31 5 12 5ZM12 7L13.5 10H16.5L14 12L15 15L12 13L9 15L10 12L7.5 10H10.5L12 7Z" fill="#64748B"/>
    <text x="26" y="16" fill="#64748B" font-family="system-ui" font-size="11" font-weight="600">Early Supporter</text>
  </svg>`,
  pillLight: `<svg viewBox="0 0 110 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="110" height="24" rx="4" fill="#F8FAFC"/>
    <rect x="0.5" y="0.5" width="109" height="23" rx="3.5" stroke="#94A3B8" stroke-opacity="0.5"/>
    <path d="M12 5C8.69 5 6 7.69 6 11C6 14.31 8.69 17 12 17C15.31 17 18 14.31 18 11C18 7.69 15.31 5 12 5ZM12 7L13.5 10H16.5L14 12L15 15L12 13L9 15L10 12L7.5 10H10.5L12 7Z" fill="#475569"/>
    <text x="26" y="16" fill="#475569" font-family="system-ui" font-size="11" font-weight="600">Early Supporter</text>
  </svg>`,
  compact: `<svg viewBox="0 0 60 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="18" rx="3" fill="#0B1220"/>
    <rect x="0.5" y="0.5" width="59" height="17" rx="2.5" stroke="#64748B" stroke-opacity="0.5"/>
    <path d="M9 4C6.24 4 4 6.24 4 9C4 11.76 6.24 14 9 14C11.76 14 14 11.76 14 9C14 6.24 11.76 4 9 4ZM9 5.5L10 7.5H12L10.5 9L11.2 11L9 9.8L6.8 11L7.5 9L6 7.5H8L9 5.5Z" fill="#64748B"/>
    <text x="18" y="12.5" fill="#64748B" font-family="system-ui" font-size="9" font-weight="600">Early</text>
  </svg>`,
  iconOnly: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2C4.69 2 2 4.69 2 8C2 11.31 4.69 14 8 14C11.31 14 14 11.31 14 8C14 4.69 11.31 2 8 2ZM8 4L9.5 7H12.5L10 9L11 12L8 10L5 12L6 9L3.5 7H6.5L8 4Z" fill="#64748B"/>
  </svg>`,
};

export const BADGE_SEED: BadgeSeedData[] = [
  {
    code: "FOUNDING_MENTOR",
    name: "Founding Mentor",
    description: "One of the first mentors to join Mentorfy",
    tier: "special",
    textColor: "#FBBF24",
    bgColor: "#0B1220",
    borderColor: "#FBBF24",
    iconVariants: FOUNDING_MENTOR_ICONS,
  },
  {
    code: "VERIFIED_MENTOR",
    name: "Verified Mentor",
    description: "Identity and employment verified",
    tier: "trust",
    textColor: "#3B82F6",
    bgColor: "#0B1220",
    borderColor: "#3B82F6",
    iconVariants: VERIFIED_MENTOR_ICONS,
  },
  {
    code: "EARLY_SUPPORTER",
    name: "Early Supporter",
    description: "Joined during Mentorfy's early days",
    tier: "community",
    textColor: "#64748B",
    bgColor: "#0B1220",
    borderColor: "#64748B",
    iconVariants: EARLY_SUPPORTER_ICONS,
  },
];

export const BADGE_TIERS = ["special", "trust", "impact", "community", "activity"] as const;
export type BadgeTier = typeof BADGE_TIERS[number];
