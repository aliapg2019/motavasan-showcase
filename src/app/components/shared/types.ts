// ============ SHARED TYPES ============

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  phone?: string | null;
}

export interface GeneratedContent {
  captions: string[];
  stories: string[];
  reels_script: { hook: string; body: string; cta: string };
  ads: { short: string; long: string };
  hashtags: string[];
}

export interface Generation {
  id: string;
  productName: string;
  category: string;
  price?: string;
  audience?: string;
  tone: string;
  goal: string;
  templateType: string;
  result: GeneratedContent;
  createdAt: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  tone: string;
  formality: string;
  emojiLevel: string;
  slangLevel: string;
  isActive: boolean;
}

export interface Template {
  id: string;
  name: string;
  nameFa: string;
  type: string;
  description: string;
  descriptionFa: string;
}

export interface Plan {
  id: string;
  name: string;
  nameEn: string;
  price: string;
  priceNum: number;
  features: string[];
  popular?: boolean;
  limits: { dailyGenerations: number; templates: string | string[]; historyDays: number };
}

export interface UsageData {
  todayUsage: number;
  totalUsage: number;
  totalGenerations: number;
  plan: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  role: string;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: string;
  _count: { generations: number; brandProfiles: number };
  subscription?: { endDate: string | null; status: string } | null;
}

export interface AdminStats {
  totalUsers: number;
  totalGenerations: number;
  generationsToday: number;
  planStats: Record<string, number>;
  revenueEstimate: number;
}

export interface SubscriptionDetail {
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  daysRemaining: number;
}

export interface Invoice {
  id: string;
  planName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
}
