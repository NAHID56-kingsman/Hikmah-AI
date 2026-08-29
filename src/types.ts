export interface Verse {
  surah_no: number;
  ayah_no: number;
  ref: string;
  surah_name_ar: string;
  surah_name_translit: string;
  surah_name_en: string;
  surah_name_bn?: string;
  arabic: string;
  english: string;
  bangla: string;
  themes: string[];
  tafsir_en?: string | null;
  tafsir_bn?: string | null;
  score?: number;
}

export type DistressLevel = 'none' | 'elevated' | 'crisis';

export interface DistressCheckResult {
  level: DistressLevel;
  isCrisis: boolean;
  isElevated: boolean;
  matched_pattern?: string | null;
  support_response?: string;
  hotlines?: {
    country: string;
    name: string;
    contact: string;
  }[];
}

export type SupportedLanguage = 'en' | 'bn' | 'banglish';

export interface ReflectionRequest {
  message: string;
  preferredLanguage?: 'auto' | 'en' | 'bn' | 'banglish';
  selectedThemes?: string[];
}

export interface ReflectionResponse {
  user_message: string;
  detected_lang: 'en' | 'bn' | 'banglish';
  distress: DistressCheckResult;
  verses: Verse[];
  all_relatable_verses?: Verse[];
  total_relatable_count?: number;
  matched_topics?: { key: string; name: string; nameBn: string; count: number }[];
  reflection: string;
  query_used?: string;
}

export interface ThemeCategory {
  id: string;
  key: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  iconName?: string;
  keywords: string[];
  verses: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  detected_lang?: 'en' | 'bn' | 'banglish';
  versesReferenced?: string[];
}

export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  user_context?: string;
  verses?: Verse[];
  preferredLanguage?: 'auto' | 'en' | 'bn' | 'banglish';
}

export interface ChatResponse {
  message: string;
  detected_lang: 'en' | 'bn' | 'banglish';
  versesReferenced?: string[];
}
