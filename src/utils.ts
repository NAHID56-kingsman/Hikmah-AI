import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generates Quran audio recitation URL from EveryAyah CDN
export function getAyahAudioUrl(surahNo: number, ayahNo: number): string {
  const sStr = String(surahNo).padStart(3, '0');
  const aStr = String(ayahNo).padStart(3, '0');
  // Sheikh Mishary Rashid Alafasy recitation
  return `https://everyayah.com/data/Alafasy_128kbps/${sStr}${aStr}.mp3`;
}

export function formatThemeName(themeKey: string): string {
  return themeKey
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getThemeBanglaName(themeKey: string): string {
  const map: Record<string, string> = {
    patience_and_hardship: 'ধৈর্য ও প্রতিকূলতা',
    anxiety_and_fear: 'উদ্বেগ, ভয় ও মনের শান্তি',
    grief_and_loss: 'শোক, দুঃখ ও সান্ত্বনা',
    hope_in_allahs_mercy: 'আল্লাহর রহমতের আশা ও নিরাশা মুক্তি',
    forgiveness_and_repentance: 'ক্ষমা, তাওবা ও ইস্তিগফার',
    gratitude: 'শুকরিয়া, কৃতজ্ঞতা ও নিয়ামত',
    trust_in_allah_tawakkul: 'তাওয়াক্কুল ও আল্লাহর উপর ভরসা',
    financial_hardship_and_provision: 'আর্থিক সংকট, জীবিকা ও রিযিক',
    family_and_marriage_conflict: 'পরিবার, দাম্পত্য ও আত্মীয়তা',
    parents_and_kindness: 'পিতা-মাতা ও সদ্ব্যবহার',
    children_and_parenting: 'সন্তান-সন্ততি ও লালন-পালন',
    loneliness: 'একাকীত্ব ও আল্লাহর সান্নিধ্য',
    anger_and_conflict: 'রাগ ও সংঘাত নিয়ন্ত্রণ',
    illness_and_health: 'অসুস্থতা, নিরাময় ও আরোগ্য (শিফা)',
    guidance_and_decision_making: 'সঠিক দিকনির্দেশনা ও সিদ্ধান্ত',
    remembrance_and_dhikr: 'আল্লাহর যিকির ও অন্তরের প্রশান্তি',
    prayer_and_dua: 'সালাত, দুআ ও মোনাজাত',
    justice_and_truth: 'ন্যায়বিচার, ইনসাফ ও সত্য',
    charity_and_sadaqah: 'দান-সদকা ও পরোপকার',
    sincerity_and_ikhlas: 'ইখলাস ও নিয়তের বিশুদ্ধতা',
    humility_vs_arrogance: 'বিনয় ও অহংকার পরিহার',
    truthful_speech_and_guarding_tongue: 'সত্যবাদী বাক্য, গীবত ও পরনিন্দা বর্জন',
    protection_from_evil_and_waswas: 'শয়তানের ধোঁকা ও অনিষ্ট থেকে রক্ষা',
    striving_effort_and_hard_work: 'পরিশ্রম, সাধনা ও সৎ চেষ্টা',
    brotherhood_and_community: 'ঐক্য, ভ্রাতৃত্ব ও সামাজিক সম্প্রীতি',
    paradise_and_hereafter: 'জান্নাত, আখেরাত ও পরম সুখ',
    hellfire_and_divine_warning: 'জাহান্নাম  সতর্কবাণী',
    knowledge_and_wisdom: 'জ্ঞান, প্রজ্ঞা ও নিদর্শন',
    tests_of_faith_and_steadfastness: 'ঈমানের পরীক্ষা ও অবিচলতা',
    honesty_in_trade_and_contracts: 'সততা, ব্যবসা-বাণিজ্য ও আমানত',
    chastity_and_modesty: 'শালীনতা, সতীত্ব ও আত্মরক্ষা',
    contentment_and_inner_peace: 'অল্পে তুষ্টি ও অন্তরের প্রফুল্লতা',
    freeing_from_envy_and_jealousy: 'হিংসা ও বিদ্বেষ থেকে মুক্তি',
    calamities_and_natural_trials: 'প্রাকৃতিক বিপর্যয় ও পার্থিব পরীক্ষা',
    victory_and_ultimate_success: 'বিজয়, সাফল্য ও কল্যাণ',
    care_for_orphans_and_weak: 'এতিম, মিসকিন ও দুর্বলদের অধিকার',
    love_of_allah_and_prophet: 'আল্লাহ ও রাসূলের ভালোবাসা',
    creation_and_nature_wonders: 'মহাবিশ্ব সৃষ্টি ও প্রকৃতির নিদর্শন',
    tahajjud_and_night_worship: 'তাহাজ্জুদ ও রাতের ইবাদত',
    cleanliness_and_purity: 'পবিত্রতা ও তাহারাত',
    fasting_and_ramadan: 'রোজা, রমজান ও তাকওয়া',
    hajj_and_pilgrimage: 'হজ, ওমরাহ ও পবিত্র স্থান',
    prophets_stories_and_lessons: 'নবীদের কাহিনী ও শিক্ষণীয় ঘটনা',
    friendship_and_good_company: 'সৎ সঙ্গ ও বন্ধুত্ব',
    death_and_resurrection: 'মৃত্যু, পুনরুত্থান ও হিসাব-নিকাশ',
    forbearance_and_pardoning_people: 'মানুষকে ক্ষমা ও পরমতসহিষ্ণুতা',
    overcoming_hopelessness: 'হতাশা থেকে মুক্তি ও নব আশা',
    youth_and_righteous_character: 'যৌবন ও সৎ চরিত্র গঠন',
    guarding_covenants_and_trusts: 'অঙ্গীকার পালন ও আমানত রক্ষা',
    moderation_and_balance: 'মধ্যমপন্থা ও ভারসাম্যপূর্ণ জীবন',
    dignity_of_humanity: 'মানবজাতির মর্যাদা ও সম্মান',
    protection_of_life_and_peace: 'জীবনের নিরাপত্তা ও শান্তি প্রতিষ্ঠা',
  };
  return map[themeKey] || formatThemeName(themeKey);
}
