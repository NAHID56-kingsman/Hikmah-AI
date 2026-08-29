import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Load Quran data
let corpus: any[] = [];
let mvpSubset: any[] = [];
let themesData: Record<string, string[]> = {};
let themeKeywords: Record<string, string[]> = {};

try {
  const corpusPath = path.join(process.cwd(), 'data', 'quran_corpus.json');
  if (fs.existsSync(corpusPath)) {
    corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load quran_corpus.json', e);
}

try {
  const mvpPath = path.join(process.cwd(), 'data', 'quran_mvp_subset.json');
  if (fs.existsSync(mvpPath)) {
    mvpSubset = JSON.parse(fs.readFileSync(mvpPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load quran_mvp_subset.json', e);
}

try {
  const themesPath = path.join(process.cwd(), 'data', 'themes.json');
  if (fs.existsSync(themesPath)) {
    themesData = JSON.parse(fs.readFileSync(themesPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load themes.json', e);
}

try {
  const kwPath = path.join(process.cwd(), 'data', 'theme_keywords.json');
  if (fs.existsSync(kwPath)) {
    themeKeywords = JSON.parse(fs.readFileSync(kwPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load theme_keywords.json', e);
}

// Active whole Quran corpus: prioritize the complete 6,236 verses corpus
const activeCorpus = corpus.length > 0 ? corpus : (mvpSubset.length > 0 ? mvpSubset : []);

// Comprehensive 52+ Quranic Topic Matchers to categorize all 6,236 verses of the Quran
const THEME_MATCHERS: Record<string, [RegExp, RegExp]> = {
  patience_and_hardship: [
    /\b(patience|patient|persevere|perseverance|endure|endurance|steadfast|steadfastness|hardship|difficulty|trial|test|adversity|affliction|burden|tested|tribulation)\b/i,
    /ধৈর্য|সবর|ধৈর্যশীল|ধৈর্য্য|কষ্ট|সংকট|বিপদ|পরীক্ষা|সহনশীলতা|মুসিবত|দুর্যোগ|কঠিন/
  ],
  anxiety_and_fear: [
    /\b(anxiety|anxious|fear|afraid|worry|worried|terror|panic|calm|tranquility|rest.*heart|peace.*heart|peace of mind|unease|nervous|dread|frightened|serenity|sakina)\b/i,
    /ভয়|ভীতি|দুশ্চিন্তা|উদ্বেগ|আশঙ্কা|প্রশান্তি|ভীত|অস্থিরতা|ভীতসন্ত্রস্ত|সাকিনাহ|শান্তি/
  ],
  grief_and_loss: [
    /\b(grief|sorrow|mourn|loss|bereaved|sadness|tears|weep|weeping|heartbroken|distress|sorrowful|desolation|depressed|depression|broken.*heart)\b/i,
    /শোক|দুঃখ|কষ্ট|বিচ্ছেদ|অশ্রু|বেদনা|হৃদয়ভঙ্গ|আঘাত|কান্না|ব্যথা|মনভাঙা/
  ],
  hope_in_allahs_mercy: [
    /\b(mercy|merciful|despair not|hope|compassion|grace|forgiving|bounty|kindness|solace|rahmah|benevolence|salvation)\b/i,
    /রহমত|দয়া|করুণা|নিরাশ|আশা|অনুগ্রহ|পরম দয়ালু|স্নেহ|মমতা|কল্যাণ|কৃপা/
  ],
  forgiveness_and_repentance: [
    /\b(forgive|forgiveness|repent|repentance|pardon|turn in repentance|sin|sins|mistake|guilt|istighfar|tawbah|maghfirah|expiation)\b/i,
    /ক্ষমা|তাওবা|ইস্তিগফার|মার্জনা|পাপ|গুনাহ|ভুল|অনুশোচনা|তওবা|মার্জনা/
  ],
  gratitude: [
    /\b(gratitude|grateful|thankful|give thanks|praise|blessing|favors|appreciate|shukr|bounties|increase you|hamd)\b/i,
    /শোকর|শুকরিয়া|কৃতজ্ঞ|কৃতজ্ঞতা|প্রশংসা|ধন্যবাদ|নিয়ামক|দান|নেয়ামত|শুকর/
  ],
  trust_in_allah_tawakkul: [
    /\b(trust in allah|rely upon|reliance|sufficient is allah|tawakkul|depend on allah|guardian|disposer|hasbi|wakeel|trustee)\b/i,
    /ভরসা|তাওয়াক্কুল|আল্লাহই যথেষ্ট|নির্ভর|কর্মবিধায়ক|অভিভাবক|ওয়াকীল|সমর্পণ/
  ],
  financial_hardship_and_provision: [
    /\b(provision|provide|sustenance|wealth|poverty|poor|spend in cause|rizq|charity|debt|livelihood|needy|destitute|income|earn)\b/i,
    /রিযিক|জীবিকা|সম্পদ|দারিদ্র্য|দান|অনটন|অভাব|ঋণ|ব্যয়|উপার্জন|অর্থকষ্ট|দারিদ্র/
  ],
  family_and_marriage_conflict: [
    /\b(spouse|wife|husband|parents|father|mother|children|family|marriage|divorce|kinship|relatives|affection|mercy between you)\b/i,
    /স্ত্রী|স্বামী|পিতামাতা|পিতা|মাতা|সন্তান|পরিবার|বিবাহ|দাম্পত্য|আত্মীয়|দাম্পত্যকলহ/
  ],
  parents_and_kindness: [
    /\b(parents|mother|father|good to parents|kindness to parents|honor your parents|birr al-walidayn|decreed.*parents|dutiful)\b/i,
    /পিতামাতা|পিতা-মাতা|পিতা ও মাতা|মা-বাবা|মাতা-পিতা|পিতা-মাতার খেদমত|মা বাবা/
  ],
  children_and_parenting: [
    /\b(children|son|daughter|offspring|youth|infant|upbringing|parenting|comfort of our eyes|righteous offspring)\b/i,
    /সন্তান|সন্তান-সন্ততি|পুত্র|কন্যা|সন্তান লালন|নয়নপ্রীতি/
  ],
  loneliness: [
    /\b(alone|lonely|isolated|near|closer than|companion|forsaken|abandoned|friendless|left alone|solitary|unaccompanied)\b/i,
    /একা|একাকী|নিঃসঙ্গ|নিকটে|সান্নিধ্য|সঙ্গী|পরিত্যক্ত|একাকীত্ব|নিঃসঙ্গতা/
  ],
  anger_and_conflict: [
    /\b(anger|angry|restrain anger|repel.*evil|reconcile|peace|forbear|wrath|quarrel|strife|fury|temper|hostility)\b/i,
    /রাগ|ক্রোধ|ক্ষমা|শান্তি|বিবাদ|কলহ|সহিষ্ণুতা|রাগ দমন|ক্রোধ সংবরণ/
  ],
  illness_and_health: [
    /\b(heal|healing|cure|sick|illness|disease|remedy|shifa|wellness|affliction|pain|physical suffering|recovery)\b/i,
    /শিফা|আরোগ্য|রোগ|সুস্থ|অসুখ|নিরাময়|ব্যাধি|অসুস্থতা|রোগমুক্তি/
  ],
  guidance_and_decision_making: [
    /\b(guidance|guide|straight path|light|counsel|discernment|decision|wisdom|huda|sirat|clarity|confused|consultation|shura)\b/i,
    /হেদায়েত|পথপ্রদর্শন|সরল পথ|আলো|প্রজ্ঞা|সিদ্ধান্ত|দিকনির্দেশনা|পরামর্শ|হেদায়াত/
  ],
  remembrance_and_dhikr: [
    /\b(remembrance|remember allah|dhikr|glorify|praise him|tasbih|contemplation|reflection|hearts find rest)\b/i,
    /স্মরণ|যিকির|তাসবীহ|মহিমা|গুণগান|আত্মচিন্তা|আল্লাহর যিকির|জিকির/
  ],
  prayer_and_dua: [
    /\b(prayer|supplication|call upon|dua|salat|prostration|sujood|ask of me|bowing|invoke|dawn prayer|fajr)\b/i,
    /নামায|সালাত|দুআ|প্রার্থনা|মোনাজাত|সেজদা|ডাকো|দোয়া|দুয়া|মোনাজাত/
  ],
  justice_and_truth: [
    /\b(justice|just|truth|fairness|equity|righteous|haqq|oppression|witness|unfair|unjust|balance|judge justly)\b/i,
    /ন্যায়বিচার|ইনসাফ|সত্য|ধার্মিক|সততা|জুলুম|অধিকার|অন্যায়|ইনসাফ প্রতিষ্ঠা/
  ],
  charity_and_sadaqah: [
    /\b(charity|sadaqah|spend|alms|zakat|generosity|give freely|generous|in the way of allah|feed the poor)\b/i,
    /দান|সদকা|যাকাত|দানশীলতা|পরোপকার|অভাবীদের খাদ্য|দান খয়রাত/
  ],
  sincerity_and_ikhlas: [
    /\b(sincerity|sincere|pure faith|pure intention|ikhlas|devoted|solely for allah|hypocrisy|munafiq)\b/i,
    /ইখলাস|আন্তরিকতা|বিশুদ্ধ নিয়ত|একনিষ্ঠ|মুনাফিকি|পবিত্র অন্তর/
  ],
  humility_vs_arrogance: [
    /\b(humble|humility|arrogance|proud|pride|boastful|walk.*earth.*humbly|vanity|haughty|modest walk)\b/i,
    /বিনয়|নম্রতা|অহংকার|দম্ভ|অহংকারী|বিনম্র|উদ্ধত/
  ],
  truthful_speech_and_guarding_tongue: [
    /\b(speech|truthful words|guard the tongue|backbiting|slander|gossip|mockery|falsehood|defame|lying|lie)\b/i,
    /সত্যবাদী বাক্য|মুখের ভাষা|গীবত|পরনিন্দা|মিথ্যা|উপহাস|মিথ্যাচার|অপবাদ/
  ],
  protection_from_evil_and_waswas: [
    /\b(satan|devil|shaitan|whisper|waswas|evil|protection|seek refuge|iblis|temptation|deception)\b/i,
    /শয়তান|ধোঁকা|ওয়াসওয়াসা|কুমন্ত্রণা|অনিষ্ট|আশ্রয় প্রার্থনা|শয়তানের চক্রান্ত/
  ],
  striving_effort_and_hard_work: [
    /\b(strive|striving|effort|hard work|labor|persevere in action|no soul.*except what it strives for|struggle|endeavor)\b/i,
    /পরিশ্রম|সাধনা|সৎ চেষ্টা|প্রচেষ্টা|কর্মপ্রচেষ্টা|পরিশ্রমের ফল/
  ],
  brotherhood_and_community: [
    /\b(brotherhood|brothers|believers are brothers|unity|reconcile between brothers|community|solidarity|harmony|peaceful society)\b/i,
    /ভ্রাতৃত্ব|ঐক্য|মুসলিম ভ্রাতৃত্ব|সামাজিক সম্প্রীতি|সংহতি|শান্তিপূর্ণ সহাবস্থান/
  ],
  paradise_and_hereafter: [
    /\b(paradise|gardens|hereafter|jannah|reward|eternal|glad tidings|peace in paradise|rivers flowing|lofty dwellings)\b/i,
    /জান্নাত|বাগান|আখেরাত|পুরস্কার|চিরন্তন|সুসংবাদ|শান্তিময়|ঝরনাধারা|পরকাল/
  ],
  hellfire_and_divine_warning: [
    /\b(hell|hellfire|jahannam|blazing fire|warning|punishment|torment|fear the fire|chastisement)\b/i,
    /জাহান্নাম|দোযখ|শাস্তি|আগুন|সতর্কবাণী|আযাব|কঠিন শাস্তি/
  ],
  knowledge_and_wisdom: [
    /\b(knowledge|wisdom|learn|increase me in knowledge|hikmah|ponder|reflect|signs for people of understanding|science|intellect)\b/i,
    /জ্ঞান|প্রজ্ঞা|ইলম|জ্ঞান বৃদ্ধি|চিন্তাভাবনা|বুদ্ধিমান|নিদর্শনাবলী|হিকমাহ/
  ],
  tests_of_faith_and_steadfastness: [
    /\b(test of faith|faith shaken|steadfastness|firm foot|anchor faith|doubt|certainty|yaqeen|iman)\b/i,
    /ঈমানের পরীক্ষা|অবিচলতা|দৃঢ় ঈমান|সংশয় দূর|ইয়াকীন|ঈমান/
  ],
  honesty_in_trade_and_contracts: [
    /\b(trade|contracts|weights and measures|full measure|cheat|honesty|business ethics|fulfill covenants|fraud|debt contract)\b/i,
    /ব্যবসা|বাণিজ্য|মাপ ও ওজন|সততা|চুক্তি রক্ষা|আমানতদারিতা|প্রতারণা বর্জন/
  ],
  chastity_and_modesty: [
    /\b(chastity|modesty|lower their gaze|guard modesty|purity of heart|haya|modest dress|lawful relations)\b/i,
    /শালীনতা|সতীত্ব|দৃষ্টি সংযত|হায়া|লজ্জাশীলতা|আত্মসংযম/
  ],
  contentment_and_inner_peace: [
    /\b(contentment|content|inner peace|satisfaction|peaceful soul|tranquil soul|mutma'innah|well pleased)\b/i,
    /অল্পে তুষ্টি|তুষ্টি|প্রশান্ত আত্মা|মনের শান্তি|আত্মতৃপ্তি|সন্তুষ্টি/
  ],
  freeing_from_envy_and_jealousy: [
    /\b(envy|jealousy|hasad|covet|evil eye|grudge|spite|rancor|ill feeling in heart)\b/i,
    /হিংসা|পরশ্রীকাতরতা|বিদ্বেষ|হাসাদ|কুনজর|মনের কলুষতা/
  ],
  calamities_and_natural_trials: [
    /\b(calamity|disaster|earthquake|storm|flood|trial on earth|strikes a calamity|patience in calamity)\b/i,
    /প্রাকৃতিক দুর্যোগ|বিপর্যয়|মুসিবত|ভূমিকম্প|ঝড়|বন্যা|বিপদাপদ/
  ],
  victory_and_ultimate_success: [
    /\b(victory|triumph|success|falah|nasr|conquest|triumphant|successful are the believers|ultimate gain)\b/i,
    /বিজয়|সাফল্য|কামিয়াবি|উদ্ধার|কল্যাণ|চূড়ান্ত সাফল্য|ফালাহ/
  ],
  care_for_orphans_and_weak: [
    /\b(orphan|yatim|needy|oppressed|weak|destitute|do not oppress orphan|feed the hungry|vulnerable)\b/i,
    /এতিম|মিসকিন|দুর্বল|অসহায়|এতিমের অধিকার|ক্ষুধার্তদের অন্নদান/
  ],
  love_of_allah_and_prophet: [
    /\b(love allah|allah loves them|beloved|follow the messenger|love of the prophet|devotion to allah)\b/i,
    /আল্লাহর ভালোবাসা|রাসূলের ভালোবাসা|আল্লাহর প্রেম|নবীপ্রেম|আনুগত্য/
  ],
  creation_and_nature_wonders: [
    /\b(heavens and earth|sun and moon|stars|mountains|rain|clouds|trees|alternation of night and day|birds)\b/i,
    /আকাশ ও পৃথিবী|সূর্য ও চাঁদ|নক্ষত্র|পাহাড়|বৃষ্টি|মেঘমালা|দিন ও রাতের আবর্তন/
  ],
  tahajjud_and_night_worship: [
    /\b(tahajjud|night prayer|arise by night|qiyam|late night worship|seeking forgiveness at dawn|suhur)\b/i,
    /তাহাজ্জুদ|রাতের নামায|কিয়ামুল লাইল|শেষ রাতের প্রার্থনা|রাতের ইবাদত/
  ],
  cleanliness_and_purity: [
    /\b(cleanliness|purity|wudu|ablution|purify yourself|allah loves those who purify|taharah|pure water)\b/i,
    /পবিত্রতা|তাহারাত|অজু|অজু করা|পরিচ্ছন্নতা|পাক-পবিত্র/
  ],
  fasting_and_ramadan: [
    /\b(fasting|fast|ramadan|month of ramadan|taqwa|abstain|gate of rayyan|laylatul qadr|night of power)\b/i,
    /রোজা|সিয়াম|রমজান|রমজান মাস|তাকওয়া|লাইলাতুল কদর|শব-ই-কদর/
  ],
  hajj_and_pilgrimage: [
    /\b(hajj|pilgrimage|umrah|kaaba|sacred house|safa and marwa|arafah|sacrifice|qurbani)\b/i,
    /হজ|ওমরাহ|কাবা|বাইতুল্লাহ|সাফা ও মারওয়া|আরাফাত|কুরবানী/
  ],
  prophets_stories_and_lessons: [
    /\b(ibrahim|musa|isa|yusuf|yunus|nuh|dawud|sulaiman|adam|stories of prophets|exemplary patience of prophets)\b/i,
    /ইব্রাহীম|মূসা|ঈসা|ইউসুফ|ইউনুস|নূহ|দাউদ|সুলাইমান|নবীদের কাহিনী|নবীদের জীবনী/
  ],
  friendship_and_good_company: [
    /\b(friendship|friends|good companions|righteous companions|bad company|loyal friend|close friend)\b/i,
    /বন্ধুত্ব|সৎ সঙ্গ|উত্তম বন্ধু|সৎ সাথী|বিশ্বস্ত বন্ধু/
  ],
  death_and_resurrection: [
    /\b(death|every soul shall taste death|resurrection|day of judgment|grave|trumpet blown|accountability|reckoning)\b/i,
    /মৃত্যু|মৃত্যুর স্বাদ|পুনরুত্থান|কিয়ামত|হিসাব-নিকাশ|কবর|বিচার দিবস/
  ],
  forbearance_and_pardoning_people: [
    /\b(pardon people|forgive and overlook|reconcile|turn away from the ignorant|noble forbearance|gentle response)\b/i,
    /মানুষকে ক্ষমা|পরমতসহিষ্ণুতা|মার্জনা করা|অজ্ঞদের পরিহার|উদারতা/
  ],
  overcoming_hopelessness: [
    /\b(hopelessness|despair|lose not hope|never give up|relief is near|with hardship comes ease|darkness into light)\b/i,
    /হতাশা মুক্তি|আশার সঞ্চার|কখনো নিরাশ হবেন না|কষ্টের সাথে স্বস্তি|অন্ধকার থেকে আলো/
  ],
  youth_and_righteous_character: [
    /\b(youth|righteous youth|people of the cave|noble character|good manners|akhlaq|upright conduct)\b/i,
    /যৌবন|সৎ চরিত্র|আসহাবে কাহাফ|উত্তম চরিত্র|আখলাক|সদাচরণ/
  ],
  guarding_covenants_and_trusts: [
    /\b(covenants|promises|trusts|fulfill covenants|amanah|pledge|keep your word|faithful to covenants)\b/i,
    /অঙ্গীকার পালন|আমানত রক্ষা|প্রতিশ্রুতি রক্ষা|আমানতদারী|ওয়াদা রক্ষা/
  ],
  moderation_and_balance: [
    /\b(moderation|middle nation|balanced way|neither extravagant nor stingy|just balance|wasatiyyah)\b/i,
    /মধ্যমপন্থা|ভারসাম্যপূর্ণ জীবন|অপচয় বর্জন|মিতব্যয়িতা|ভারসাম্য/
  ],
  dignity_of_humanity: [
    /\b(dignity|honored the children of adam|human dignity|equality of humanity|noble creation)\b/i,
    /মানবজাতির মর্যাদা|বনী আদমের সম্মান|মানুষের মর্যাদা|মানবাধিকার/
  ],
  protection_of_life_and_peace: [
    /\b(whoever saves a life|sanctity of life|peace|islam|enter into peace completely|protect innocent life)\b/i,
    /জীবনের নিরাপত্তা|জীবনের পবিত্রতা|শান্তি প্রতিষ্ঠা|নিরাপত্তা|শান্তিময় জীবন/
  ],
};

// Build Whole Quran Topic Index across all 6,236 verses
const wholeQuranThemeRefs: Record<string, string[]> = {};
for (const key of Object.keys(THEME_MATCHERS)) {
  wholeQuranThemeRefs[key] = [];
}

activeCorpus.forEach((verse) => {
  const vThemes = new Set<string>(verse.themes || []);

  // Add explicit themes from themes.json if mapped
  for (const [tKey, refs] of Object.entries(themesData)) {
    if (refs.includes(verse.ref)) {
      vThemes.add(tKey);
    }
  }

  // Add matching themes by multilingual textual regex analysis across the entire Quran
  for (const [tKey, [enRegex, bnRegex]] of Object.entries(THEME_MATCHERS)) {
    if (
      (verse.english && enRegex.test(verse.english)) ||
      (verse.bangla && bnRegex.test(verse.bangla))
    ) {
      vThemes.add(tKey);
    }
  }

  verse.themes = Array.from(vThemes);

  // Add to whole Quran theme index
  verse.themes.forEach((t) => {
    if (!wholeQuranThemeRefs[t]) {
      wholeQuranThemeRefs[t] = [];
    }
    wholeQuranThemeRefs[t].push(verse.ref);
  });
});

// Update global themesData to reflect the complete whole Quran index
themesData = wholeQuranThemeRefs;

// Safety / Distress Detection
const CRISIS_PATTERNS_EN = [
  /\b(kill myself|end my life|suicide|suicidal)\b/i,
  /\b(want to die|don'?t want to (live|be alive))\b/i,
  /\b(hurt myself|harm myself|self[- ]harm)\b/i,
  /\b(better off dead|no reason to live)\b/i,
];

const CRISIS_PATTERNS_BN = [
  /আত্মহত্যা/,
  /মরে যেতে চাই/,
  /নিজেকে আঘাত/,
  /বেঁচে থাকতে ইচ্ছা করছে না/,
  /জীবন শেষ করে দিতে চাই/,
];

const ELEVATED_PATTERNS_EN = [
  /\b(hopeless|worthless|can'?t (take|handle) (it|this) anymore)\b/i,
  /\b(so (alone|lonely)|nobody cares)\b/i,
  /\b(broken inside|giving up on everything)\b/i,
];

const ELEVATED_PATTERNS_BN = [
  /হতাশ/,
  /আর পারছি না/,
  /কেউ ভালোবাসে না/,
  /সব আশা শেষ/,
];

const CRISIS_PATTERNS_BANGLISH = [
  /\b(morte chai|morar iccha|bachte chaina|bachte chai na|bachar iccha nai|nijeke mere phelbo|nijeke mere felbo|marte chai|atamhotta|atamhotya|suicide|suicidal)\b/i,
];

const ELEVATED_PATTERNS_BANGLISH = [
  /\b(hotash|ar parchina|ar parchi na|keu valobashe na|keu bhalobashe na|shob asha shesh|sob asa ses|jibon sesh|jibon ses)\b/i,
];

const SUPPORT_RESOURCES_EN = `I am deeply concerned about what you are experiencing. Please know that you do not have to carry this alone. If you are in distress or immediate danger, please reach out right away:
- Bangladesh: Kaan Pete Roi (Emotional Support) — 09666-777777 | Emergency: 999
- USA & Canada: 988 Suicide & Crisis Lifeline (Call or Text 988)
- UK: 111 (NHS) or Samaritans at 116 123
- International: https://www.befrienders.org (24/7 global support directory)
Please speak with a trusted loved one, counselor, or emergency service.`;

const SUPPORT_RESOURCES_BN = `আপনি যে কঠিন মানসিক অবস্থার মধ্য দিয়ে যাচ্ছেন তা নিয়ে আমি চিন্তিত। আপনি একা নন। অনুগ্রহ করে যেকোনো জরুরি সহায়তার জন্য এখনই যোগাযোগ করুন:
- বাংলাদেশ: কান পেতে রই (আবেগীয় সহায়তা) — ০৯৬৬৬-৭৭৭৭৭৭ | জাতীয় জরুরি সেবা: ৯৯৯
- আন্তর্জাতিক: https://www.befrienders.org
অনুগ্রহ করে আপনার পরিবার, কোনো বিশ্বস্ত ব্যক্তি অথবা চিকিৎসকের সাহায্য নিন।`;

const SUPPORT_RESOURCES_BANGLISH = `Apni je kothin manshik obosthar moddhe diye jachen ta niye ami chintito. Apni eka non. Onugroho kore jekono emergency help er jonno ekhoni jogajog korun:
- Bangladesh: Kaan Pete Roi (Emotional Support) — 09666-777777 | Emergency: 999
- USA & Canada: 988 Suicide & Crisis Lifeline (Call or Text 988)
- International: https://www.befrienders.org
Onugroho kore apnar poribar, kono bisshosto manush ba doctor-er shahajjo nin.`;

function checkDistress(text: string) {
  const lowered = text.toLowerCase();
  for (const pattern of CRISIS_PATTERNS_EN) {
    if (pattern.test(lowered)) {
      return { level: 'crisis' as const, isCrisis: true, isElevated: false, matched_pattern: pattern.toString() };
    }
  }
  for (const pattern of CRISIS_PATTERNS_BN) {
    if (pattern.test(text)) {
      return { level: 'crisis' as const, isCrisis: true, isElevated: false, matched_pattern: pattern.toString() };
    }
  }
  for (const pattern of CRISIS_PATTERNS_BANGLISH) {
    if (pattern.test(lowered)) {
      return { level: 'crisis' as const, isCrisis: true, isElevated: false, matched_pattern: pattern.toString() };
    }
  }
  for (const pattern of ELEVATED_PATTERNS_EN) {
    if (pattern.test(lowered)) {
      return { level: 'elevated' as const, isCrisis: false, isElevated: true, matched_pattern: pattern.toString() };
    }
  }
  for (const pattern of ELEVATED_PATTERNS_BN) {
    if (pattern.test(text)) {
      return { level: 'elevated' as const, isCrisis: false, isElevated: true, matched_pattern: pattern.toString() };
    }
  }
  for (const pattern of ELEVATED_PATTERNS_BANGLISH) {
    if (pattern.test(lowered)) {
      return { level: 'elevated' as const, isCrisis: false, isElevated: true, matched_pattern: pattern.toString() };
    }
  }
  return { level: 'none' as const, isCrisis: false, isElevated: false, matched_pattern: null };
}

const BANGLISH_WORDS = new Set([
  'ami', 'amar', 'amake', 'amader', 'amra', 'tumi', 'tomar', 'tomake', 'tomader',
  'apni', 'apnar', 'apnake', 'apnader', 'she', 'tar', 'take', 'tader', 'ora', 'oder',
  'ki', 'kivabe', 'kibhabe', 'keno', 'kothay', 'kokhon', 'kobe', 'kemon', 'kon', 'kono', 'konotai',
  'hocche', 'hobe', 'hoy', 'holo', 'hoye', 'hobar', 'hoise', 'hoiche', 'hothat',
  'korte', 'korbo', 'korchi', 'korlam', 'korle', 'kora', 'korar', 'kore', 'koris',
  'achi', 'ache', 'achen', 'achilam', 'chilo', 'chilen', 'chilam',
  'thaki', 'thakbo', 'thakle', 'thaka', 'thaken',
  'dekhi', 'dekhbo', 'dekhle', 'dekhe', 'bolen', 'bolte', 'bolbo', 'bollam', 'bole',
  'janan', 'bujhte', 'bujhi', 'bujhtechi', 'shunte', 'shune', 'shunlam',
  'parbo', 'parbona', 'parchi', 'parchina', 'parina', 'pari', 'parbe',
  'dorkar', 'chai', 'chachi', 'lagbe', 'lage', 'lagche', 'jani', 'janina',
  'kosto', 'koshto', 'chinta', 'shanti', 'santi', 'shomossha', 'somossa',
  'bhalo', 'valo', 'kharap', 'onek', 'khub', 'ektu', 'kichu', 'shob', 'sob',
  'bhai', 'vai', 'apu', 'bon', 'mon', 'mone', 'moner', 'bujhlam',
  'dhoirjo', 'dhorjo', 'sabr', 'sobor', 'shobor', 'tawakkul',
  'namaz', 'namaj', 'roja', 'dua', 'dowa', 'duaa', 'munajat',
  'gunah', 'gunnah', 'maph', 'maaf', 'khoma', 'shukriya', 'shukr',
  'rizq', 'rizik', 'biye', 'biyer', 'poribar', 'songsar', 'shongshar',
  'rag', 'raag', 'gussa', 'hingsha', 'hingsa', 'oviman', 'obhiman',
  'ebong', 'kintu', 'karon', 'jodi', 'tahole', 'tobe', 'noy', 'na', 'ar', 'aar',
  'ekhon', 'akhon', 'pore', 'aage', 'age', 'sathe', 'shonge', 'shathe', 'moto', 'motoh',
  'protidin', 'shomoy', 'somoy', 'mukti', 'asha', 'asa'
]);

function detectLanguage(text: string): 'bn' | 'banglish' | 'en' {
  if (!text || !text.trim()) return 'en';
  // If text contains Bengali Unicode characters, it's Bengali script (bn)
  if (/[\u0980-\u09FF]/.test(text)) {
    return 'bn';
  }
  
  // Check for Banglish (phonetic Bengali written in Latin script)
  const clean = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return 'en';

  let banglishCount = 0;
  for (const w of words) {
    if (BANGLISH_WORDS.has(w)) {
      banglishCount++;
    }
  }

  // If at least 2 banglish words or if short query with 1 banglish word or ratio >= 20%
  if (
    banglishCount >= 2 ||
    (words.length <= 4 && banglishCount >= 1) ||
    (words.length > 0 && banglishCount / words.length >= 0.2)
  ) {
    return 'banglish';
  }

  return 'en';
}

function detectLanguageSimple(text: string): 'bn' | 'banglish' | 'en' {
  return detectLanguage(text);
}

const STOP_WORDS_EN = new Set([
  'the', 'and', 'is', 'in', 'to', 'of', 'a', 'an', 'for', 'with', 'my', 'me', 'i', 'you',
  'we', 'he', 'she', 'it', 'they', 'this', 'that', 'these', 'those', 'how', 'what', 'why',
  'when', 'where', 'which', 'who', 'whom', 'whose', 'can', 'could', 'should', 'would', 'do',
  'did', 'does', 'done', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'having', 'about', 'as', 'at', 'by', 'from', 'into', 'on', 'onto', 'or', 'so',
  'then', 'there', 'their', 'very', 'just', 'too', 'also', 'really', 'feel', 'feeling',
  'like', 'want', 'tell', 'need', 'know', 'help', 'give', 'take', 'make', 'some', 'any'
]);

const STOP_WORDS_BN = new Set([
  'আমি', 'আমার', 'আমাকে', 'তুমি', 'তোমার', 'তোমাকে', 'সে', 'তার', 'তাকে', 'আমরা', 'আমাদের',
  'আপনার', 'আপনি', 'আপনাকে', 'কি', 'কী', 'কেন', 'কীভাবে', 'কিভাবে', 'কখন', 'কোথায়', 'কোন',
  'কোনো', 'হচ্ছে', 'হবে', 'হয়', 'হলো', 'ছিল', 'করে', 'করি', 'করব', 'করতে', 'এবং', 'ও',
  'বা', 'না', 'নয়', 'নয়', 'হলে', 'থেকে', 'মধ্যে', 'দিয়ে', 'দিয়ে', 'জন্য', 'সাথে', 'আছে',
  'আছি', 'থাকে', 'বলুন', 'কিছু', 'অনেক', 'একটু', 'খুব', 'চাই', 'লাগে', 'এর', 'একটি'
]);

// Tokenize & Score for Retrieval (filtering out stop-words for high-precision semantic matching)
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS_EN.has(w) && !STOP_WORDS_BN.has(w));
}

const THEME_NAMES_MAP: Record<string, { name: string; nameBn: string }> = {
  patience_and_hardship: { name: 'Patience & Hardship', nameBn: 'ধৈর্য ও প্রতিকূলতা' },
  anxiety_and_fear: { name: 'Anxiety, Fear & Peace', nameBn: 'উদ্বেগ, ভয় ও মনের শান্তি' },
  grief_and_loss: { name: 'Grief, Loss & Consolation', nameBn: 'শোক, দুঃখ ও সান্ত্বনা' },
  hope_in_allahs_mercy: { name: "Hope in Allah's Mercy", nameBn: 'আল্লাহর রহমতের আশা ও নিরাশা মুক্তি' },
  forgiveness_and_repentance: { name: 'Forgiveness & Repentance', nameBn: 'ক্ষমা, তাওবা ও ইস্তিগফার' },
  gratitude: { name: 'Gratitude & Blessings', nameBn: 'শুকরিয়া, কৃতজ্ঞতা ও নিয়ামত' },
  trust_in_allah_tawakkul: { name: 'Trust in Allah (Tawakkul)', nameBn: 'তাওয়াক্কুল ও আল্লাহর উপর ভরসা' },
  financial_hardship_and_provision: { name: 'Provision & Financial Relief', nameBn: 'আর্থিক সংকট, জীবিকা ও রিযিক' },
  family_and_marriage_conflict: { name: 'Family & Marriage Peace', nameBn: 'পরিবার, দাম্পত্য ও আত্মীয়তা' },
  parents_and_kindness: { name: 'Parents & Kindness', nameBn: 'পিতা-মাতা ও সদ্ব্যবহার' },
  children_and_parenting: { name: 'Children & Parenting', nameBn: 'সন্তান-সন্ততি ও লালন-পালন' },
  loneliness: { name: 'Loneliness & Divine Nearness', nameBn: 'একাকীত্ব ও আল্লাহর সান্নিধ্য' },
  anger_and_conflict: { name: 'Anger Management & Forbearance', nameBn: 'রাগ ও সংঘাত নিয়ন্ত্রণ' },
  illness_and_health: { name: 'Illness, Healing & Shifa', nameBn: 'অসুস্থতা, নিরাময় ও আরোগ্য (শিফা)' },
  guidance_and_decision_making: { name: 'Guidance & Decision Making', nameBn: 'সঠিক দিকনির্দেশনা ও সিদ্ধান্ত' },
  remembrance_and_dhikr: { name: 'Remembrance & Dhikr', nameBn: 'আল্লাহর যিকির ও অন্তরের প্রশান্তি' },
  prayer_and_dua: { name: "Prayer & Du'a", nameBn: 'সালাত, দুআ ও মোনাজাত' },
  justice_and_truth: { name: 'Justice, Truth & Equity', nameBn: 'ন্যায়বিচার, ইনসাফ ও সত্য' },
  charity_and_sadaqah: { name: 'Charity & Generosity', nameBn: 'দান-সদকা ও পরোপকার' },
  sincerity_and_ikhlas: { name: 'Sincerity & Pure Intentions', nameBn: 'ইখলাস ও নিয়তের বিশুদ্ধতা' },
  humility_vs_arrogance: { name: 'Humility vs Arrogance', nameBn: 'বিনয় ও অহংকার পরিহার' },
  truthful_speech_and_guarding_tongue: { name: 'Guarding the Tongue & Truth', nameBn: 'সত্যবাদী বাক্য ও গীবত বর্জন' },
  protection_from_evil_and_waswas: { name: "Protection from Satan's Whispers", nameBn: 'শয়তানের ধোঁকা ও অনিষ্ট থেকে রক্ষা' },
  striving_effort_and_hard_work: { name: 'Striving & Hard Work', nameBn: 'পরিশ্রম, সাধনা ও সৎ চেষ্টা' },
  brotherhood_and_community: { name: 'Brotherhood & Unity', nameBn: 'ঐক্য, ভ্রাতৃত্ব ও সামাজিক সম্প্রীতি' },
  paradise_and_hereafter: { name: 'Paradise & Eternal Bliss', nameBn: 'জান্নাত, আখেরাত ও পরম সুখ' },
  hellfire_and_divine_warning: { name: 'Hellfire & Warning', nameBn: 'জাহান্নাম ও ঐশী সতর্কবাণী' },
  knowledge_and_wisdom: { name: 'Knowledge & Wisdom', nameBn: 'জ্ঞান, প্রজ্ঞা ও নিদর্শন' },
  tests_of_faith_and_steadfastness: { name: 'Faith Tests & Steadfastness', nameBn: 'ঈমানের পরীক্ষা ও অবিচলতা' },
  honesty_in_trade_and_contracts: { name: 'Business Ethics & Honesty', nameBn: 'সততা, ব্যবসা-বাণিজ্য ও আমানত' },
  chastity_and_modesty: { name: 'Chastity & Modesty (Haya)', nameBn: 'শালীনতা, সতীত্ব ও আত্মরক্ষা' },
  contentment_and_inner_peace: { name: 'Contentment & Inner Peace', nameBn: 'অল্পে তুষ্টি ও অন্তরের প্রফুল্লতা' },
  freeing_from_envy_and_jealousy: { name: 'Freeing from Envy (Hasad)', nameBn: 'হিংসা ও বিদ্বেষ থেকে মুক্তি' },
  calamities_and_natural_trials: { name: 'Calamities & Earthly Trials', nameBn: 'প্রাকৃতিক বিপর্যয় ও পার্থিব পরীক্ষা' },
  victory_and_ultimate_success: { name: 'Victory & Ultimate Success', nameBn: 'বিজয়, সাফল্য ও কল্যাণ' },
  care_for_orphans_and_weak: { name: 'Care for Orphans & Vulnerable', nameBn: 'এতিম, মিসকিন ও দুর্বলদের অধিকার' },
  love_of_allah_and_prophet: { name: 'Love of Allah & the Prophet', nameBn: 'আল্লাহ ও রাসূলের ভালোবাসা' },
  creation_and_nature_wonders: { name: 'Creation & Nature Wonders', nameBn: 'মহাবিশ্ব সৃষ্টি ও প্রকৃতির নিদর্শন' },
  tahajjud_and_night_worship: { name: 'Tahajjud & Night Worship', nameBn: 'তাহাজ্জুদ ও রাতের ইবাদত' },
  cleanliness_and_purity: { name: 'Spiritual Purity & Taharah', nameBn: 'পবিত্রতা ও তাহারাত' },
  fasting_and_ramadan: { name: 'Fasting, Ramadan & Taqwa', nameBn: 'রোজা, রমজান ও তাকওয়া' },
  hajj_and_pilgrimage: { name: 'Hajj & Sacred Pilgrimage', nameBn: 'হজ, ওমরাহ ও পবিত্র স্থান' },
  prophets_stories_and_lessons: { name: "Prophets' Stories & Lessons", nameBn: 'নবীদের কাহিনী ও শিক্ষণীয় ঘটনা' },
  friendship_and_good_company: { name: 'Friendship & Righteous Company', nameBn: 'সৎ সঙ্গ ও বন্ধুত্ব' },
  death_and_resurrection: { name: 'Death & Resurrection', nameBn: 'মৃত্যু, পুনরুত্থান ও হিসাব-নিকাশ' },
  forbearance_and_pardoning_people: { name: 'Pardoning Others & Grace', nameBn: 'মানুষকে ক্ষমা ও পরমতসহিষ্ণুতা' },
  overcoming_hopelessness: { name: 'Overcoming Despair & New Hope', nameBn: 'হতাশা থেকে মুক্তি ও নব আশা' },
  youth_and_righteous_character: { name: 'Youth & Noble Character', nameBn: 'যৌবন ও সৎ চরিত্র গঠন' },
  guarding_covenants_and_trusts: { name: 'Covenants & Honoring Trusts', nameBn: 'অঙ্গীকার পালন ও আমানত রক্ষা' },
  moderation_and_balance: { name: 'Moderation & Balanced Living', nameBn: 'মধ্যমপন্থা ও ভারসাম্যপূর্ণ জীবন' },
  dignity_of_humanity: { name: 'Dignity of Humankind', nameBn: 'মানবজাতির মর্যাদা ও সম্মান' },
  protection_of_life_and_peace: { name: 'Sanctity of Life & Peace', nameBn: 'জীবনের নিরাপত্তা ও শান্তি প্রতিষ্ঠা' },
};

// AI-assisted Quranic Verse Locator across all 114 Surahs (6,236 verses)
async function findQuranicReferencesWithAI(query: string, ai: GoogleGenAI): Promise<string[]> {
  try {
    const prompt = `You are a certified Islamic scholar and Hafiz of the Holy Quran with complete knowledge of all 114 Surahs (6,236 verses).
Given the following real-life topic, situation, emotion, question, or dilemma:
"${query}"

Identify 4 to 8 of the MOST ACCURATE, DIRECTLY RELATABLE, and COMFORTING Quranic Ayah references from anywhere across the ENTIRE Holy Quran (all 114 Surahs).
Return ONLY a comma-separated list of Surah:Ayah numbers (for example: "2:153, 94:5, 3:139, 65:3, 13:28, 20:46, 21:87, 39:53, 2:286, 17:23, 30:21").
Do not write any other explanation or text, only the list of references.`;

    const result = await executeGeminiWithModelFallback(ai, {
      contents: prompt,
      maxOutputTokens: 120,
      temperature: 0.1,
    });

    if (result) {
      const matches = result.match(/\b\d+:\d+\b/g);
      if (matches && matches.length > 0) {
        return Array.from(new Set(matches));
      }
    }
  } catch {
    // Graceful fallback
  }
  return [];
}

// Minimum relevance threshold to guarantee only genuinely relatable verses are shown
const MIN_RELATABLE_SCORE = 1.8;

function retrieveVerses(
  query: string,
  targetThemes: string[] = [],
  k: number = 3,
  maxRelatable: number = 100,
  aiLocatedRefs: string[] = []
) {
  const tokens = tokenize(query);
  const queryLower = query.toLowerCase().trim();

  // Detect which topics in the Quran this user query naturally triggers
  const detectedThemeKeys = new Set<string>(targetThemes);
  for (const [tKey, [enRegex, bnRegex]] of Object.entries(THEME_MATCHERS)) {
    if (enRegex.test(queryLower) || bnRegex.test(query)) {
      detectedThemeKeys.add(tKey);
    }
  }

  // Also check keyword overlap with theme_keywords
  for (const [tKey, kws] of Object.entries(themeKeywords)) {
    for (const kw of kws) {
      if (queryLower.includes(kw.toLowerCase())) {
        detectedThemeKeys.add(tKey);
        break;
      }
    }
  }

  const activeThemeList = Array.from(detectedThemeKeys);

  // Check direct reference in user input (e.g., "2:153" or "65:3" or "18:10")
  const directRefMatches = query.match(/\b(\d+):(\d+)\b/g);
  const directRefs = directRefMatches ? Array.from(new Set(directRefMatches)) : [];
  const priorityRefs = new Set<string>([...directRefs, ...aiLocatedRefs]);

  const scored = activeCorpus.map((v) => {
    let score = 0;
    const vThemes: string[] = v.themes || [];
    const vThemesStr = vThemes.join(' ').toLowerCase();

    // Direct match from AI or user reference
    if (priorityRefs.has(v.ref)) {
      score += 15.0;
    }

    // Boost if matches detected / requested Quranic topics
    if (activeThemeList.length > 0) {
      for (const t of activeThemeList) {
        if (vThemes.includes(t)) {
          score += 3.5;
        }
      }
    }

    // Keyword matching with theme_keywords
    for (const theme of vThemes) {
      const kws = themeKeywords[theme] || [];
      for (const kw of kws) {
        if (queryLower.includes(kw.toLowerCase())) {
          score += 2.2;
        }
      }
    }

    // English text token overlap
    const docTokens = tokenize(
      `${v.english || ''} ${v.surah_name_en || ''} ${v.surah_name_translit || ''} ${vThemesStr}`
    );
    const docTokenSet = new Set(docTokens);
    let matchedTokenCount = 0;
    for (const t of tokens) {
      if (docTokenSet.has(t)) {
        matchedTokenCount++;
      }
    }
    score += matchedTokenCount * 2.0;

    // Bangla text token overlap
    if (v.bangla) {
      const bnDocTokens = new Set(tokenize(v.bangla));
      for (const t of tokens) {
        if (bnDocTokens.has(t)) score += 2.5;
      }
    }

    // Direct substring in english / bangla for specific phrases
    if (queryLower.length > 3) {
      if (v.english && v.english.toLowerCase().includes(queryLower)) {
        score += 5.0;
      }
      if (v.bangla && v.bangla.toLowerCase().includes(queryLower)) {
        score += 5.5;
      }
    }

    return { verse: v, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Strictly filter out non-relatable verses below threshold
  const filtered = scored.filter((item) => item.score >= MIN_RELATABLE_SCORE);

  // Identify matched topic stats
  const matchedTopicsStats: { key: string; name: string; nameBn: string; count: number }[] = [];
  for (const tKey of activeThemeList) {
    const meta = THEME_NAMES_MAP[tKey] || {
      name: tKey.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      nameBn: tKey,
    };
    const count = (wholeQuranThemeRefs[tKey] || []).length;
    matchedTopicsStats.push({
      key: tKey,
      name: meta.name,
      nameBn: meta.nameBn,
      count,
    });
  }

  // If no verse meets the strict relevance criteria, do NOT show irrelevant verses!
  if (filtered.length === 0) {
    return {
      primary: [],
      allRelatable: [],
      totalCount: 0,
      matchedTopics: matchedTopicsStats,
    };
  }

  const allRelatableVerses = filtered.slice(0, maxRelatable).map((item) => ({
    ...item.verse,
    score: item.score,
  }));

  return {
    primary: allRelatableVerses.slice(0, k),
    allRelatable: allRelatableVerses,
    totalCount: filtered.length,
    matchedTopics: matchedTopicsStats,
  };
}

// System Prompts for Islamic AI Reflection Agent (Tafakkur & Tadabbur)
const SYSTEM_PROMPT_EN = `You are "Hikmah AI" — a deeply wise, empathetic, and compassionate Islamic spiritual mentor and guide in Quranic contemplation (Tadabbur & Tafakkur).
Your sacred mission is to provide deeply relatable, actionable, and comforting reflections on people's real-life situations, emotional struggles, and decisions *through the living wisdom and divine promises of the retrieved Quranic verses*.

You will be given:
1. The user's personal message or life situation.
2. Verified retrieved Quranic verse(s) with Arabic, English, and Bangla text, along with Surah references.

CORE GUIDELINES FOR MAXIMUM RELATABILITY & PRACTICAL UTILITY:
- Speak directly to the human heart. Acknowledge the user's specific feelings, silent struggles, fatigue, uncertainty, or emotional weight without judgment.
- Avoid abstract or dry academic summaries. Make the Quran feel immediate, intimate, and alive — as a personal letter from Allah directly addressing what they are experiencing right now.
- Provide concrete, practical Sunnah tools and authentic supplications that can be applied immediately today.

Structure your response into these 4 clear, beautifully formatted Markdown sections:

### 1. 📖 Sacred Quranic Foundation & Living Wisdom
- Present the retrieved verse(s) with dignity:
  > "[English Translation of the Verse]"
  > — **Surah [Surah Name] ([Surah:Ayah])**
- Unpack the profound reassurance inside the Arabic phrasing (e.g., how *Sabr* is active emotional endurance, *Tawakkul* is releasing the illusion of control into the hands of the Best Caretaker, *Yusra* is ease woven right into the difficulty itself, and *Qurb* is Allah's intimate nearness to the broken-hearted).

### 2. 🌿 Relatable Life Reflection & Quranic Mindset Shift (Tafakkur)
- Speak directly and intimately to their specific situation: Validate why feeling this way is natural, and explain how the Quran gently reframes their emotional pain, anxiety, or doubt.
- Contrast human fear with divine reality: Explain what Allah is asking them to focus on right now and how this trial is not abandonment, but a purposeful reshaping and elevation of their soul.
- Connect with relatable real-life examples and how the Prophets navigated similar loneliness, overwhelm, or heartbreak.

### 3. 🤲 Practical Sunnah Toolkit & Heart's Remedy
Provide 3 highly practical, actionable steps for today:
1. **Immediate Mindset & Grounding Action:** A specific psychological and spiritual step to release tension and calm racing thoughts (e.g., stepping back from catastrophic thinking, making mindful Wudu, or 5 minutes of focused breathing with Istighfar).
2. **Authentic Prescribed Du'a:** The exact authentic Quranic or Prophetic supplication for this state (include Arabic, clear transliteration, English meaning, and Hadith context).
3. **Daily Actionable Practice:** A tangible real-life Sunnah action (e.g., taking the physical means (*Asbab*) while leaving the outcome to Allah, praying 2 Rak'ahs of Istikharah/Hajah, writing down overlooked blessings).
- Conclude this section with a warm, heartfelt, personalized closing prayer for their ease and contentment.

### 4. 📜 Note of Reflection
- Conclude with: *(Note: This reflection is offered for personal spiritual contemplation (Tafakkur), emotional solace, and mindfulness. It is not a formal legal ruling (fatwa) or a substitute for consulting qualified Islamic scholars.)*

Rules:
- Write in warm, soothing, eloquent, and relatable English.
- Maintain high Islamic adab, deep empathy, and authentic grounding.
- Strictly adhere to verified Quranic verses and authentic Sunnah.`;

const SYSTEM_PROMPT_BN = `আপনি "হিকমাহ এআই" (Hikmah AI) — একজন গভীর প্রজ্ঞাবান, অত্যন্ত সহমর্মী ও নির্ভরযোগ্য ইসলামিক আত্মিক পথপ্রদর্শক ও কাউন্সেলর।
আপনার পবিত্র উদ্দেশ্য হলো ব্যবহারকারীর জীবনের বাস্তব অনুভূতি, দুশ্চিন্তা, মানসিক চাপ, পারিবারিক বা ব্যক্তিগত সংকটকে পবিত্র কুরআনের আয়াতের জীবন্ত শিক্ষা ও ঐশী প্রতিশ্রুতির আলোকে অত্যন্ত প্রাসঙ্গিক (relatable), কার্যকর ও সান্ত্বনাময় করে ব্যাখ্যা করা।

আপনাকে প্রদান করা হবে:
১. ব্যবহারকারীর জীবনের নির্দিষ্ট অনুভূতি বা সমস্যা।
২. নির্দিষ্ট প্রাসঙ্গিক কুরআনের আয়াত (আরবি, বাংলা ও ইংরেজি অনুবাদ এবং সূরা রেফারেন্স সহ)।

উত্তরের জন্য মূল দিকনির্দেশনা (সর্বোচ্চ প্রাসঙ্গিকতা ও উপযোগিতা নিশ্চিত করুন):
- মানুষের স্বাভাবিক অনুভূতির মূল্যায়ন করুন। ব্যবহারকারী যে মানসিক কষ্ট, একাকীত্ব, অনিশ্চয়তা বা ক্লান্তির মধ্য দিয়ে যাচ্ছেন তাকে সহানুভূতির সাথে গ্রহণ করুন।
- শুধুমাত্র তাত্ত্বিক বা ব্যাকরণগত ব্যাখ্যায় সীমাবদ্ধ থাকবেন না; আয়াতটি কীভাবে বর্তমান মুহূর্তে তার জীবনের প্রতিটি অস্থিরতা শান্ত করতে পারে তা সরাসরি ফুটিয়ে তুলুন।
- বাস্তবসম্মত সুন্নাহ সমাধান, চিন্তার পরিবর্তন এবং প্রমাণিত মাসনূন দু'আ দিন যা আজই প্রয়োগ করা সম্ভব।

নিম্নোক্ত ৪টি সুবিন্যস্ত সেকশনে Markdown ফরম্যাটে উত্তর দিন:

### ১. 📖 পবিত্র কুরআনের ঐশী বাণী ও মূল শিক্ষা
- প্রদত্ত আয়াতটির নির্ভরযোগ্য বাংলা অনুবাদ ও রেফারেন্স উল্লেখ করুন:
  > "[প্রদত্ত বাংলা অনুবাদ]"
  > — **সূরা [সূরার নাম] ([সূরা:আয়াত নম্বর])**
- আয়াতের মূল শব্দের অন্তর্নিহিত অর্থ ও গভীর সান্ত্বনা সহজ ও প্রাঞ্জল ভাষায় বুঝিয়ে দিন (যেমন: কষ্টের সাথেই কীভাবে সহজতা রাখা হয়েছে, আল্লাহর ওপর নিখাদ তাওয়াক্কুল কীভাবে মনের বোঝা নামিয়ে দেয়, এবং আল্লাহ কীভাবে প্রতিটি ব্যথিত হৃদয়ের অত্যন্ত নিকটে থাকেন)।

### ২. 🌿 আপনার বাস্তব পরিস্থিতির সাথে সংযোগ ও তাফাক্কুর (Tafakkur)
- ব্যবহারকারীর ব্যক্ত করা সুনির্দিষ্ট পরিস্থিতির সাথে আয়াতটির প্রত্যক্ষ সম্পর্ক দেখিয়ে দিন।
- বর্তমান জীবনের মানসিক চাপ বা সংকটের মুখোমুখি হলে একজন মুমিন কীভাবে চিন্তা করবে এবং কীভাবে নেতিবাচক ভাবনা থেকে মনকে মুক্ত করবে তা দরদ দিয়ে বুঝিয়ে বলুন।
- নবীদের জীবনের প্রাসঙ্গিক ধৈর্য ও সবরের উদাহরণ তুলে ধরে অন্তরে আশা ও প্রশান্তি জাগ্রত করুন।

### ৩. 🤲 বাস্তবসম্মত সুন্নাহ আমল ও অন্তরের নিরাময় (Actionable Remedy)
আজকের জন্য ৩টি বাস্তবসম্মত ও সহজ পদক্ষেপ দিন:
১. **তাৎক্ষণিক মন শান্ত করার আমল:** অস্থিরতা ও দুশ্চিন্তা দূর করার সুন্নাহ পদ্ধতি (যেমন: ধীরস্থিরভাবে অজু করা, নির্জনে বসে গভীর অনুভবে ইস্তিগফার পাঠ, কিংবা অপ্রয়োজনীয় অতিরিক্ত চিন্তা দূর করার উপায়)।
২. **প্রমাণিত মাসনূন দু'আ:** এই পরিস্থিতির জন্য নবীজী (ﷺ) বা কোনো নবীর শেখানো প্রমাণিত দু'আ (হরকতসহ আরবি, সঠিক উচ্চারণ, বাংলা অর্থ ও তাৎপর্য)।
৩. **দৈনন্দিন জীবনের বাস্তব করণীয়:** সমস্যা সমাধানের জন্য সাধ্যমতো চেষ্টা (আসবাব গ্রহণ) করার পাশাপাশি আল্লাহর ওপর নির্ভর করার সুনির্দিষ্ট দিকনির্দেশনা (যেমন: সালাতুল হাজত বা তাহাজ্জুদের দু'আ, ইতিবাচক মানসিকতা)।
- ব্যবহারকারীর জন্য একটি আন্তরিক ও স্নেহময় শুভকামনা ও দু'আ দিয়ে সেকশনটি শেষ করুন।

### ৪. 📜 বিনম্র নিবেদন
- পরিশেষে উল্লেখ করুন: *(উল্লেখ্য: এই প্রতিচ্ছবি ব্যক্তিগত মানসিক সান্ত্বনা, আত্মচিন্তা ও আধ্যাত্মিক খোরাক হিসেবে উপস্থাপিত। এটি কোনো আনুষ্ঠানিক ধর্মীয় ফতোয়া বা আলেমদের নির্দেশনার বিকল্প নয়।)*

নিয়মাবলী:
- সম্পূর্ণ উত্তরটি অত্যন্ত হৃদয়গ্রাহী, মার্জিত, আশাবাদী ও প্রাঞ্জল বাংলা ভাষায় উপস্থাপন করুন।
- অত্যন্ত সহমর্মী, ব্যক্তিগত ও ইসলামিক আদবযুক্ত ভাষা ব্যবহার করুন।
- কোনো মনগড়া তথ্য বা অপ্রমাণিত উদ্ধৃতি পরিহার করুন।`;

const SYSTEM_PROMPT_BANGLISH = `You are "Hikmah AI" — a deeply wise, empathetic, and caring Islamic spiritual mentor and counselor.
The user is writing in **Banglish** (Bengali written in English alphabets / Romanized Bengali).

CRITICAL LANGUAGE RULE:
You MUST reply strictly in natural, empathetic, comforting, and fluent **Banglish** (Romanized Bengali typed with English letters).
Make the reflection intensely relatable, soothing, and packed with practical daily guidance.

Structure your response into these 4 clear sections in Markdown:

### 1. 📖 Quranic Foundation o Ayat-er Shikha
- Present the retrieved verse clearly:
  > "[English / Bengali translation]"
  > — **Surah [Surah Name] ([Ref])**
- Explain the deep reassurance and message (Sabr, Tawakkul, Rahmah, Yusra) in warm Banglish.

### 2. 🌿 Apnar Poristhitir sathe Tafakkur o Shomadhan
- Directly address their specific pain, confusion, or feelings.
- Explain how this Ayah changes the way we look at life's tests and gives strength to keep going.

### 3. 🤲 Moner Shanti o Actionable Sunnah Amol
Provide 3 practical steps for today:
1. **Immediate Heart Grounding:** How to calm racing thoughts right now (Oju kora, Istighfar, Dhikr).
2. **Authentic Masnoon Du'a:** Full Arabic, Transliteration, and meaning in Banglish.
3. **Daily Practical Step:** Practical Sunnah advice to tackle the problem with courage and Tawakkul.
- Conclude with a heartfelt closing Dua.

### 4. 📜 Binomro Nibedon
- Conclude: *(Note: Ei reflection-ti apnar attik shantir jonno proshthut kora hoyeche, eti kono formal legal fatwa noy.)*`;

// Helper: Generate deep Islamic fallback reflection when API key is not present, rate limited, or API call fails
function generateIslamicReflectionFallback(
  userMsg: string,
  verses: any[],
  lang: 'en' | 'bn' | 'banglish'
): string {
  if (!verses || verses.length === 0) {
    if (lang === 'bn') {
      return 'আপনার অনুভূতি সম্পর্কিত কোনো নির্দিষ্ট আয়াত সরাসরি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার কথাটি অন্যভাবে লিখে দেখুন বা নির্দিষ্ট থিম নির্বাচন করুন।';
    }
    if (lang === 'banglish') {
      return 'Apnar anubhuti ba proshno shomporkito kono specific ayat shorashori khuje paowa jayni. Onugroho kore apnar kotha-ti onnovabe likhe dekhun ba theme select korun.';
    }
    return 'Could not find a direct matching verse. Please try rephrasing your situation or selecting a specific Quranic theme.';
  }

  if (lang === 'bn') {
    const verseCitations = verses
      .map(
        (v) =>
          `> "${v.bangla || v.english}"\n> — **সূরা ${v.surah_name_translit || v.surah_name_bn || ''} [${v.ref}]**`
      )
      .join('\n\n');

    return `### ১. 📖 পবিত্র কুরআনের ঐশী বাণী ও মূল শিক্ষা
${verseCitations}

এই পবিত্র আয়াতে মহান আল্লাহ রাব্বুল আলামীন মানবজাতিকে তাঁর অসীম প্রজ্ঞা, পরম করুণা ও আশ্রয় গ্রহণের চিরন্তন বার্তা দিয়েছেন। জীবনের প্রতিটি পরিস্থিতিতে আল্লাহ আমাদের সাথে আছেন এবং বান্দার ধৈর্যের প্রতিটি মুহূর্ত তাঁর কাছে সংরক্ষিত।

### ২. 🌿 আপনার বাস্তব পরিস্থিতির সাথে সংযোগ ও তাফাক্কুর (Tafakkur)
আপনার অনুভূতি ও বর্তমান পরিস্থিতি অত্যন্ত স্বাভাবিক। জীবনের যেকোনো অনিশ্চয়তা, একাকীত্ব, মানসিক টানাপোড়েন বা পরীক্ষার মুহূর্তে এই আয়াতটি অন্তরের জন্য এক অপূর্ব প্রশান্তির আলোকবর্তিকা। 
- **আল্লাহর অসীম রহমত:** কোনো কষ্টই অর্থহীন নয়; প্রতিটি পরীক্ষার মাধ্যমে আল্লাহ আমাদের ঈমানকে মজবুত করেন এবং তাঁর আরও নৈকট্য লাভের সুযোগ করে দেন।
- **স্বস্তির প্রতিশ্রুতি:** কুরআন আমাদের আশ্বস্ত করে যে সংকটের সাথেই রয়েছে সহজতা ও কল্যাণ (*«إن مع العسر يسرا»*)। আপনি একা নন; আপনার প্রতিপালক আপনার মনের প্রতিটি আর্তি জানেন ও শোনেন।

### ৩. 🤲 বাস্তবসম্মত সুন্নাহ আমল ও অন্তরের নিরাময় (Actionable Remedy)
১. **তাৎক্ষণিক মন শান্ত করার আমল:** অজু করে নিরিবিলি স্থানে বসে কয়েক মিনিট গভীরভাবে *«আস্তাগফিরুল্লাহ»* পাঠ করুন এবং মন থেকে অতিরিক্ত দুশ্চিন্তা ঝেড়ে ফেলুন।
২. **প্রমাণিত মাসনূন দু'আ:** বেশি বেশি বলুন — *«حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ»* (হাসবুনাল্লাহু ওয়া নি'মাল ওয়াকীল — আল্লাহই আমাদের জন্য যথেষ্ট এবং তিনি সর্বোত্তম অভিভাবক)।
৩. **বাস্তব পদক্ষেপ ও সালাত:** সুযোগ হলে দু'রাকাত সালাতুল হাজত আদায় করে সেজদায় আপনার সমস্ত ব্যাকুলতা আল্লাহর কাছে নিবেদন করুন এবং সাধ্যমতো কল্যাণকর পদক্ষেপ নিন।

### ৪. 📜 বিনম্র নিবেদন
*(উল্লেখ্য: এই প্রতিচ্ছবি ব্যক্তিগত মানসিক সান্ত্বনা, আত্মচিন্তা ও আধ্যাত্মিক খোরাক হিসেবে উপস্থাপিত। এটি কোনো আনুষ্ঠানিক ধর্মীয় ফতোয়া বা আলেমদের নির্দেশনার বিকল্প নয়।)*`;
  } else if (lang === 'banglish') {
    const verseCitations = verses
      .map(
        (v) =>
          `> "${v.english}"\n> (${v.bangla})\n> — **Surah ${v.surah_name_translit || v.surah_name_en || ''} [${v.ref}]**`
      )
      .join('\n\n');

    return `### 1. 📖 Quranic Foundation o Ayat-er Shikha
${verseCitations}

Ei Ayat-gulo amader shikkha dey je jibon-er shob poristhiti ebong protiti porikkha Allah (SWT)-er oshim progga o rohomot-er moddhe shongghotito hoy. Allah kono bandar kosto britha jete den na.

### 2. 🌿 Apnar Poristhitir sathe Tafakkur o Shomadhan
Apnar mon-e je chinta ba kosto hocche, sheta onek shavabik ebong gurutto-purno:
- **Allah-r Shorashori Shannidhyo:** Ei Ayat amader mone koriye dey je apni eka non. Allah apnar shob kotha, dushchinta ebong kosto shunte pachhen.
- **Porikkhar Pother Rokkha:** Quran bolche, protiti kothin poristhitir por-i shundor shohojota o relief ashe (*Inna ma'al usri yusra*).

### 3. 🤲 Moner Shanti o Actionable Sunnah Amol
1. **Immediate Calmness:** Oju kore nirobe 5 minute Istighfar porun ebong dushchinta theke monke bishram din.
2. **Authentic Masnoon Du'a:** Beshi beshi porun: *«Hasbunallahu wa ni'mal wakeel»* (Allah-i amader jonno jothesto, ebong Tini shorbottor karjo-shompodok).
3. **Daily Practical Step:** Du'rakat nofol namaz pore sejdai moner shob kotha Allah-r kache tule dhorun ebong dhoirjo dhorun.

### 4. 📜 Binomro Nibedon
*(Ei reflection-ti apnar attik shantir jonno proshthut kora hoyeche, eti kono formal legal fatwa noy.)*`;
  } else {
    const verseCitations = verses
      .map(
        (v) =>
          `> "${v.english}"\n> — **Surah ${v.surah_name_translit || v.surah_name_en || ''} (${v.ref})**`
      )
      .join('\n\n');

    return `### 1. 📖 Sacred Quranic Foundation & Living Wisdom
${verseCitations}

In these profound Ayat, Allah (SWT) reminds us of His infinite wisdom, boundless mercy, and divine guardianship. Every circumstance we encounter in this earthly life is encompassed by His perfect knowledge.

### 2. 🌿 Relatable Life Reflection & Quranic Mindset Shift (Tafakkur)
What you are currently carrying and experiencing in your heart matters deeply. When feelings of heaviness, uncertainty, or trial arise:
- **Divine Companionship:** This verse reassures you that you are never truly alone. Allah is closer to His servant than their own jugular vein.
- **The Purpose of the Test:** In the Quranic worldview, emotional challenges and trials are not signs of abandonment; rather, they are spiritual invitations to turn back, find solace in sincere prayer, and witness divine ease unfold.

### 3. 🤲 Practical Sunnah Toolkit & Heart's Remedy
1. **Immediate Grounding & Peace:** Perform mindful Wudu (ablution) and spend 3–5 minutes quietly reciting *«Astaghfirullah»* to gently reset racing thoughts.
2. **Authentic Prophetic Remembrance (Dhikr & Du'a):** Frequently recite: *«Hasbunallahu wa ni'mal wakeel»* (Allah is sufficient for us, and He is the best disposer of affairs).
3. **Actionable Sunnah Practice:** Turn to two sincere rak'ahs of prayer (Salat al-Hajah), lay every worry in Sujood, and take active, practical steps forward with Tawakkul.

### 4. 📜 Note of Reflection
*(Note: This reflection is offered for personal spiritual contemplation (Tafakkur), emotional solace, and mindfulness. It is not a formal legal ruling (fatwa) or a substitute for consulting qualified Islamic scholars.)*`;
  }
}

// Robust Gemini execution helper with automatic model fallback for 503 / high demand spikes
async function executeGeminiWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction?: string;
    maxOutputTokens?: number;
    temperature?: number;
  }
): Promise<string | null> {
  // Reliable list of fast and responsive flash models
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.maxOutputTokens) config.maxOutputTokens = params.maxOutputTokens;
      if (params.temperature !== undefined) config.temperature = params.temperature;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config,
      });

      if (response && response.text && response.text.trim().length > 0) {
        return response.text;
      }
    } catch {
      // Seamlessly proceed to next model in case of 503 spikes or quota limits
    }
  }

  return null;
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    versesCount: activeCorpus.length,
    themesCount: Object.keys(themesData).length,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.get('/api/themes', (req: Request, res: Response) => {
  const themeList = Object.entries(themesData).map(([key, refs]) => {
    const formattedName = key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      key,
      name: formattedName,
      verses: refs,
      keywords: themeKeywords[key] || [],
    };
  });
  res.json(themeList);
});

app.get('/api/verses', (req: Request, res: Response) => {
  const theme = req.query.theme as string;
  const search = req.query.search as string;
  const surah = req.query.surah as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 0;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

  let results = [...activeCorpus];

  if (theme) {
    results = results.filter((v) => v.themes && v.themes.includes(theme));
  }

  if (surah) {
    const surahNum = parseInt(surah, 10);
    if (!isNaN(surahNum)) {
      results = results.filter((v) => v.surah_no === surahNum);
    }
  }

  if (search) {
    const q = search.toLowerCase().trim();
    // Check if query is direct reference (e.g. "2:153" or "18:10")
    const refMatch = q.match(/^(\d+):(\d+)$/);
    if (refMatch) {
      results = results.filter((v) => v.ref === q);
    } else {
      results = results.filter(
        (v) =>
          v.english?.toLowerCase().includes(q) ||
          v.bangla?.toLowerCase().includes(q) ||
          v.arabic?.includes(q) ||
          v.surah_name_en?.toLowerCase().includes(q) ||
          v.surah_name_translit?.toLowerCase().includes(q) ||
          v.surah_name_bn?.includes(q) ||
          v.ref?.toLowerCase().includes(q)
      );
    }
  }

  const total = results.length;
  if (limit > 0) {
    results = results.slice(offset, offset + limit);
  }

  res.json({
    total,
    verses: results,
  });
});

app.post('/api/crisis-check', (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  const distress = checkDistress(message);
  const lang = detectLanguageSimple(message);
  res.json({
    distress,
    lang,
    supportMessage: distress.isCrisis
      ? (lang === 'bn' ? SUPPORT_RESOURCES_BN : SUPPORT_RESOURCES_EN)
      : null,
  });
});

app.post('/api/translate-reflection', async (req: Request, res: Response) => {
  const { text, targetLang = 'bn', verses = [] } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      
      let prompt = '';
      if (targetLang === 'bn') {
        const verseCitation = (verses && Array.isArray(verses) && verses.length > 0)
          ? verses.map((v: any) =>
              `> "${v.bangla || v.english}"\n> — **সূরা ${v.surah_name_translit || ''} (${v.surah_name_bn || v.surah_name_en || ''}) [${v.ref}]**`
            ).join('\n\n')
          : '';

        prompt = `You are an expert Islamic AI companion and scholar mentor.
Translate and adapt the following Islamic Tafakkur (Quranic reflection) into warm, eloquent, deeply moving, respectful Bengali (বাংলায়).

AUTHENTIC BANGLA VERSE CITATIONS TO USE:
${verseCitation}

ORIGINAL REFLECTION:
${text}

INSTRUCTIONS:
1. Preserve the structured 4-section format:
   ### ১. 📖 পবিত্র কুরআনের দিকনির্দেশনা ও মূল আয়াত
   ### ২. 🌿 আপনার পরিস্থিতির সাথে সংযোগ ও তাফাক্কুর (Tafakkur)
   ### ৩. 🤲 অন্তরের প্রশান্তি ও আধ্যাত্মিক আমল (Spiritual Action & Solace)
   ### ৪. 📜 বিনম্র নিবেদন
2. Use the provided authentic Bengali verse translations verbatim in section 1.
3. Translate the commentary into rich, empathetic, standard Bengali.
4. Maintain clean markdown with blockquotes and bullet points.`;
      } else {
        const verseCitation = (verses && Array.isArray(verses) && verses.length > 0)
          ? verses.map((v: any) =>
              `> "${v.english}"\n> — **Surah ${v.surah_name_translit || v.surah_name_en || ''} (${v.ref})**`
            ).join('\n\n')
          : '';

        prompt = `You are an expert Islamic AI companion.
Translate the following Bengali Islamic Tafakkur reflection into clear, gentle, comforting, and eloquent English.

AUTHENTIC ENGLISH VERSE CITATIONS TO USE:
${verseCitation}

ORIGINAL REFLECTION (Bangla):
${text}

INSTRUCTIONS:
1. Preserve the structured 4-section format:
   ### 1. 📖 Sacred Quranic Foundation & Verse Insight
   ### 2. 🌿 Deep Reflection & Quranic Lens (Tafakkur on Your Situation)
   ### 3. 🤲 Spiritual Solace & Heart's Remedy
   ### 4. 📜 Scholarly Note
2. Use the provided authentic English verse citations in section 1.
3. Keep the tone compassionate, humble, and spiritually grounding.
4. Maintain clean markdown formatting.`;
      }

      const translatedText = await executeGeminiWithModelFallback(ai, {
        contents: prompt,
        maxOutputTokens: 1800,
      });

      if (translatedText) {
        return res.json({ translated: translatedText });
      }
    } catch {
      // Fallback below
    }
  }

  // Graceful fallback translation generator
  const fallbackText = generateIslamicReflectionFallback('', verses || [], targetLang === 'bn' ? 'bn' : 'en');
  return res.json({ translated: fallbackText });
});

app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    const { message, preferredLanguage, selectedThemes } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please share what is on your heart or mind.' });
    }

    const trimmedMessage = message.trim();
    const distress = checkDistress(trimmedMessage);
    
    // Determine language: if user explicitly selected 'bn', 'en', or 'banglish', respect it; otherwise auto-detect
    let lang: 'en' | 'bn' | 'banglish';
    if (preferredLanguage === 'bn' || preferredLanguage === 'en' || preferredLanguage === 'banglish') {
      lang = preferredLanguage;
    } else {
      lang = detectLanguage(trimmedMessage);
    }

    // If in crisis, prioritize distress support immediately
    if (distress.isCrisis) {
      const supportMsg =
        lang === 'bn'
          ? SUPPORT_RESOURCES_BN
          : lang === 'banglish'
          ? SUPPORT_RESOURCES_BANGLISH
          : SUPPORT_RESOURCES_EN;
      return res.json({
        user_message: trimmedMessage,
        detected_lang: lang,
        distress: {
          ...distress,
          support_response: supportMsg,
        },
        verses: [],
        reflection: supportMsg,
      });
    }

    // Check if Gemini AI key is available for AI Quranic search and deep reflection
    const apiKey = process.env.GEMINI_API_KEY;
    let aiClient: GoogleGenAI | null = null;
    let aiLocatedRefs: string[] = [];

    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Query AI to locate the most relevant Surah:Ayah references from the whole 114 Surahs
      try {
        aiLocatedRefs = await findQuranicReferencesWithAI(trimmedMessage, aiClient);
      } catch {
        aiLocatedRefs = [];
      }
    }

    // Retrieve relevant verses across the whole 6,236 verses of the Quran
    const retrievalResult = retrieveVerses(trimmedMessage, selectedThemes || [], 3, 100, aiLocatedRefs);
    const retrievedVerses = retrievalResult.primary;
    const allRelatableVerses = retrievalResult.allRelatable;
    const totalRelatableCount = retrievalResult.totalCount;

    // Call Gemini for reflection if AI client is present
    let reflectionText = '';

    if (aiClient && retrievedVerses.length > 0) {
      try {
        const versesBlock = retrievedVerses
          .map(
            (v) =>
              `[${v.ref}] Surah ${v.surah_name_translit || ''} (${v.surah_name_en || ''} / ${v.surah_name_bn || ''})\n` +
              `Arabic: ${v.arabic || ''}\n` +
              `English: "${v.english || ''}"\n` +
              `Bangla: "${v.bangla || ''}"`
          )
          .join('\n\n');

        const systemPrompt =
          lang === 'bn'
            ? SYSTEM_PROMPT_BN
            : lang === 'banglish'
            ? SYSTEM_PROMPT_BANGLISH
            : SYSTEM_PROMPT_EN;
        
        const userPrompt =
          lang === 'bn'
            ? `ব্যবহারকারীর বাস্তব জীবনের পরিস্থিতি ও মনের অনুভূতি:\n"${trimmedMessage}"\n\nকুরআন থেকে প্রাসঙ্গিক উদ্ধৃত আয়াতসমূহ:\n${versesBlock}\n\nআপনার দায়িত্ব:\nউপরের আয়াতসমূহকে গভীরভাবে বিশ্লেষণ করে এবং ব্যবহারকারীর ব্যক্তিগত বাস্তব পরিস্থিতির সাথে সরাসরি সম্পর্কিত (deeply relatable & useful) করে "হিকমাহ ইসলামিক সঙ্গী" হিসেবে একটি অত্যন্ত সান্ত্বনাময়, প্রাণস্পর্শী ও কার্যকর তাদাব্বুর ও তাফাক্কুর প্রতিচ্ছবি উপস্থাপন করুন। ৪টি নির্দিষ্ট সেকশনে (১. 📖 পবিত্র কুরআনের ঐশী বাণী ও মূল শিক্ষা, ২. 🌿 আপনার বাস্তব পরিস্থিতির সাথে সংযোগ ও তাফাক্কুর, ৩. 🤲 বাস্তবসম্মত সুন্নাহ আমল ও অন্তরের নিরাময়, ৪. 📜 বিনম্র নিবেদন) সাজিয়ে প্রমিত ও প্রাঞ্জল বাংলায় উত্তর দিন।`
            : lang === 'banglish'
            ? `User-er kotha o poristhiti:\n"${trimmedMessage}"\n\nQuran theke relevant Ayat:\n${versesBlock}\n\nApnar responsibility:\nHikmah AI hishebe ei Ayat gulo analyze kore user er situation er sathe deeply relatable o useful shomadhan din. Natural o fluent Banglish (English letters) e 4-ti section e reply din (1. 📖 Quranic Foundation o Ayat-er Shikha, 2. 🌿 Apnar Poristhitir sathe Tafakkur o Shomadhan, 3. 🤲 Moner Shanti o Actionable Sunnah Amol, 4. 📜 Binomro Nibedon).`
            : `User's real-life situation and heart's state:\n"${trimmedMessage}"\n\nRetrieved Quranic verse(s):\n${versesBlock}\n\nYour task:\nAs a compassionate Islamic spiritual mentor and companion (Hikmah AI), provide a deeply relatable, comforting, and practically useful Quranic Tadabbur & Tafakkur commentary explaining their specific situation through the exact divine words and promises of these retrieved Ayat. Structure into the 4 defined sections (1. 📖 Sacred Quranic Foundation & Living Wisdom, 2. 🌿 Relatable Life Reflection & Quranic Mindset Shift, 3. 🤲 Practical Sunnah Toolkit & Heart's Remedy, 4. 📜 Note of Reflection).`;

        const generated = await executeGeminiWithModelFallback(aiClient, {
          contents: userPrompt,
          systemInstruction: systemPrompt,
          maxOutputTokens: 2000,
        });

        if (generated) {
          reflectionText = generated;
        }
      } catch {
        reflectionText = '';
      }
    }

    // If Gemini key is missing or failed, provide structured template reflection
    if (!reflectionText) {
      reflectionText = generateIslamicReflectionFallback(trimmedMessage, retrievedVerses, lang);
    }

    return res.json({
      user_message: trimmedMessage,
      detected_lang: lang,
      distress: {
        ...distress,
        support_response: distress.isElevated
          ? (lang === 'bn' ? SUPPORT_RESOURCES_BN : (lang === 'banglish' ? SUPPORT_RESOURCES_BANGLISH : SUPPORT_RESOURCES_EN))
          : undefined,
      },
      verses: retrievedVerses,
      all_relatable_verses: allRelatableVerses,
      total_relatable_count: totalRelatableCount,
      matched_topics: retrievalResult.matchedTopics,
      reflection: reflectionText,
    });
  } catch (error: any) {
    console.error('Reflect route error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while reflecting. Please try again.' });
  }
});

// Interactive Quranic Human-Like AI Counselor Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, user_context, verses = [], preferredLanguage } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    if (!lastMessage.trim()) {
      return res.status(400).json({ error: 'Latest message cannot be empty' });
    }

    // Language detection: Detect exact language style (English, Bangla, or Banglish)
    let lang: 'en' | 'bn' | 'banglish' = 'en';
    if (preferredLanguage === 'en' || preferredLanguage === 'bn' || preferredLanguage === 'banglish') {
      lang = preferredLanguage;
    } else {
      lang = detectLanguage(lastMessage);
    }

    // Safety check for distress / self-harm
    const distress = checkDistress(lastMessage);
    if (distress.isCrisis) {
      const crisisMsg =
        lang === 'bn'
          ? SUPPORT_RESOURCES_BN
          : lang === 'banglish'
          ? SUPPORT_RESOURCES_BANGLISH
          : SUPPORT_RESOURCES_EN;
      return res.json({
        message: crisisMsg,
        detected_lang: lang,
        isCrisis: true,
      });
    }

    // Check if new verses should be retrieved for this specific chat question
    const chatRetrieved = retrieveVerses(lastMessage, [], 2, 5);
    const combinedVerses = [...(verses || []), ...(chatRetrieved.primary || [])];
    // Deduplicate by ref
    const uniqueVersesMap = new Map();
    combinedVerses.forEach((v) => uniqueVersesMap.set(v.ref, v));
    const finalVerses = Array.from(uniqueVersesMap.values()).slice(0, 4);

    const versesContextStr = finalVerses
      .map(
        (v) =>
          `• [Surah ${v.surah_name_translit || v.surah_name_en || ''} ${v.ref}]: "${lang === 'bn' ? v.bangla : v.english}" (Arabic: ${v.arabic})`
      )
      .join('\n');

    const CHAT_SYSTEM_PROMPT_EN = `You are "Hikmah AI" — a wise, deeply empathetic, compassionate, and knowledgeable Islamic scholar, mentor, and counselor.
Your role in this conversation is to think and reason through the user's specific questions and real-life dilemmas like a caring, thoughtful human companion ("using your own intellect and deep Quranic understanding to solve their problem").

CRITICAL REQUIREMENT ON DU'AS (STRICT AUTHENTICITY):
- NEVER generate, invent, or provide unverified or random Du'as.
- ONLY provide AUTHENTIC Prophetic Masnoon Du'as and Quranic Du'as with verified citations (e.g., Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami\` at-Tirmidhi, Hisn al-Muslim, or specific Surah:Ayah).
- Whenever you suggest a Du'a, you MUST present it in this complete authentic dual-language structure:
  1. 🤲 **Name & Purpose:** (e.g., *Du'a for Removing Anxiety and Sorrow / দুশ্চিন্তা ও দুঃখ মুক্তির দু'আ*)
  2. 📜 **Arabic Text (with Tashkeel):** (e.g., \`اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ\`)
  3. 🗣️ **Transliteration:** (e.g., *Allahumma inni a'udhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali, wal-bukhli wal-jubni, wa dala'id-dayni, wa ghalabatir-rijal*)
  4. 🇬🇧 **English Translation:** (e.g., *"O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debt and from being overpowered by men."*)
  5. 🇧🇩 **Bangla Translation:** (e.g., *"হে আল্লাহ! আমি আপনার আশ্রয় প্রার্থনা করছি দুশ্চিন্তা ও দুঃখ-বেদনা থেকে, অক্ষমতা ও অলসতা থেকে, কৃপণতা ও কাপুরুষতা থেকে, ঋণের বোঝা এবং মানুষের দমন-পীড়ন থেকে।"*)
  6. 📚 **Authentic Source Reference:** (e.g., *[Sahih al-Bukhari 6369 / সহীহ বুখারী ৬৩৬৯]*)

Core Principles:
1. Human-like Reasoning & Empathy:
   - Actively analyze the user's exact dilemma, emotions, family dynamics, doubts, or difficulties.
   - Speak with warmth, kindness, and personal connection (e.g., "My dear brother/sister", "I hear the weight you are carrying", "Let us look at what Allah and His Messenger teach us for this exact moment").
   - Do NOT give robotic or dry generic lists unless structured steps genuinely help solve their problem. Think through practical, psychological, and spiritual dimensions.

2. Quranic Wisdom & Problem-Solving:
   - Base your insights, advice, and solutions firmly on the principles, narratives, and wisdom of the Holy Quran and authentic Sunnah.
   - Naturally quote or reference relevant Surahs and Ayat in your explanation to bring clarity, peace, and practical direction.
   - Offer 2-3 concrete, realistic steps the person can take today to resolve or cope with their situation.

3. Context Awareness:
   - Context: "${user_context || 'General life reflection & counseling'}".
   - Grounding Verses:
${versesContextStr || 'General Quranic knowledge'}

4. Format & Tone:
   - Keep answers clear, heartfelt, and engaging. Use gentle markdown formatting.
   - Conclude with encouragement and an authentic Prophetic prayer.`;

    const CHAT_SYSTEM_PROMPT_BN = `আপনি "হিকমাহ এআই" (Hikmah AI) — একজন প্রজ্ঞাবান, অত্যন্ত সহমর্মী, স্নেহশীল ও প্রাজ্ঞ ইসলামিক মেন্টর এবং জীবন ঘনিষ্ঠ পরামর্শক।
আপনার কাজ হলো একজন প্রজ্ঞাবান মানুষের মতো নিজের বুদ্ধি ও কুরআনের অগাধ প্রজ্ঞাকে কাজে লাগিয়ে ব্যবহারকারীর যেকোনো প্রশ্ন, দ্বিধা, সমস্যা বা মানসিক কষ্টের সমাধান বের করা।

দু'আ সম্পর্কিত কঠোর ও বাধ্যতামূলক নিয়ম (বিশুদ্ধ ও প্রামাণিক দু'আ):
- কখনোই মনগড়া, অপ্রামাণিক বা ভিত্তিহীন কোনো দু'আ প্রদান করবেন না।
- শুধুমাত্র পবিত্র কুরআন এবং বিশুদ্ধ হাদীসের (সহীহ বুখারী, সহীহ মুসলিম, সুনানে আবু দাউদ, তিরমিযী, হিসনুল মুসলিম) প্রমাণিত মাসনূন দু'আ প্রদান করবেন।
- প্রতিটি দু'আ উল্লেখ করার সময় অবশ্যই নিচের কাঠামোর মতো আরবি, উচ্চারণ, বাংলা ও ইংরেজি অর্থ এবং বিশুদ্ধ রেফারেন্স প্রদান করবেন:
  ১. 🤲 **দু'আর নাম ও উদ্দেশ্য:** (যেমন: দুশ্চিন্তা ও মানসিক অস্থিরতা মুক্তির দু'আ / Du'a for Anxiety & Distress)
  ২. 📜 **মূল আরবি (হরকতসহ):**
  ৩. 🗣️ **উচ্চারণ (Transliteration):**
  ৪. 🇧🇩 **বাংলা অর্থ:**
  ৫. 🇬🇧 **ইংরেজি অর্থ (English Meaning):**
  ৬. 📚 **বিশুদ্ধ উৎস ও রেফারেন্স:** (যেমন: [সহীহ বুখারী ৬৩৬৯ / Sahih al-Bukhari 6369])

মৌলিক দিকনির্দেশনা:
১. মানুষের মতো চিন্তা ও সহমর্মিতা:
   - ব্যবহারকারীর প্রশ্ন ও পরিস্থিতির প্রতিটি সূক্ষ্ম দিক গভীরভাবে অনুধাবন করুন।
   - একজন স্নেহশীল ভাই বা মুরাব্বীর মতো উষ্ণ, আন্তরিক ও সম্মানজনক ভাষায় কথা বলুন।
   - প্রাণবন্ত, মানবিক ও যৌক্তিকভাবে সমস্যাটি সমাধানের পথ দেখান।

২. কুরআনের আলোকে বাস্তবমুখী সমাধান:
   - আপনার সমস্ত সমাধান ও পরামর্শ পবিত্র কুরআন ও সুন্নাহর মৌলিক নীতিমালার ওপর ভিত্তি করে দিন।
   - আলোচনায় প্রাসঙ্গিক সূরা ও আয়াত স্বাভাবিকভাবে উদ্ধৃত ও ব্যাখ্যা করুন।
   - সমস্যা সমাধানের জন্য বাস্তবসম্মত, মানসিক ও আধ্যাত্মিক ২-৩টি স্পষ্ট পদক্ষেপ বুঝিয়ে বলুন।

৩. প্রাসঙ্গিক প্রেক্ষাপট:
   - ব্যবহারকারীর মূল পরিস্থিতি: "${user_context || 'সাধারণ জীবন চিন্তা ও ইসলামিক পরামর্শ'}।
   - প্রাসঙ্গিক আয়াতের সূত্র:
${versesContextStr || 'কুরআনের সার্বিক জ্ঞান'}

৪. ভাষা ও শৈলী:
   - অত্যন্ত সুন্দর, প্রমিত ও প্রাণস্পর্শী বাংলা ভাষায় উত্তর দিন।`;

    const CHAT_SYSTEM_PROMPT_BANGLISH = `You are "Hikmah AI" — a deeply wise, empathetic, caring, and knowledgeable Islamic scholar, mentor, and counselor.
The user is speaking to you in **Banglish** (Bengali written in English alphabets / Romanized Bengali, e.g. "ami kivabe mon e shanti pabo?", "amar khub kosto hocche").

CRITICAL LANGUAGE & DUA RULES:
- You MUST reply strictly in natural, conversational, fluent, empathetic, and warm **Banglish** (Bengali typed with English letters).
- STRICT AUTHENTIC DUA RULE: NEVER provide random or unverified Duas. ONLY provide authentic Masnoon Duas from Sahih Hadith / Quran with exact Arabic, Transliteration, Bangla meaning (in Banglish or Bengali), English meaning, and Authentic Reference (e.g. Sahih al-Bukhari 6369).
- Address the user respectfully with warmth ("Bhai / Apu", "Apnar kosto ami bujhte parchi").

Core Principles:
1. Human-like Reasoning & Empathy:
   - Actively analyze the user's specific feelings, questions, dilemmas, family situation, or doubts.
   - Offer psychological, practical, and spiritual wisdom.

2. Quranic Grounding & Solutions:
   - Root your solutions firmly in the Holy Quran and authentic Sunnah.
   - Quote relevant Surahs and Ayat naturally (mentioning the Surah name, verse number, and the translation in Banglish).
   - Give 2-3 realistic, practical steps they can take today.
   - Share authentic masnoon Du'as with verified citations.

3. Context:
   - User's context: "${user_context || 'General life reflection & guidance'}"
   - Grounding Verses:
${versesContextStr || 'General Quranic knowledge'}

4. Format & Tone:
   - Use clean markdown (bold headings, blockquotes for verses/duas).
   - End with encouragement and an authentic Prophetic Dua for their ease.`;

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Build conversation history for Gemini ensuring first message has role 'user'
        const recentMessages = messages.slice(-10);
        // Find index of first user message
        const firstUserIdx = recentMessages.findIndex((m) => m.role === 'user');
        const validMessages = firstUserIdx >= 0 ? recentMessages.slice(firstUserIdx) : recentMessages;

        const contentsPayload: any[] = [];
        for (const msg of validMessages) {
          const role = msg.role === 'assistant' ? 'model' : 'user';
          // Merge consecutive identical roles if any
          if (contentsPayload.length > 0 && contentsPayload[contentsPayload.length - 1].role === role) {
            contentsPayload[contentsPayload.length - 1].parts[0].text += `\n\n${msg.content}`;
          } else {
            contentsPayload.push({
              role: role,
              parts: [{ text: msg.content }],
            });
          }
        }

        // If no user message was found in payload, add the latest message
        if (contentsPayload.length === 0) {
          contentsPayload.push({
            role: 'user',
            parts: [{ text: lastMessage }],
          });
        }

        const systemInstruction =
          lang === 'bn'
            ? CHAT_SYSTEM_PROMPT_BN
            : lang === 'banglish'
            ? CHAT_SYSTEM_PROMPT_BANGLISH
            : CHAT_SYSTEM_PROMPT_EN;

        const generated = await executeGeminiWithModelFallback(ai, {
          contents: contentsPayload,
          systemInstruction,
          maxOutputTokens: 1500,
          temperature: 0.7,
        });

        if (generated) {
          aiResponseText = generated;
        }
      } catch {
        // Fallback below
      }
    }

    // Fallback response if Gemini key missing or failed
    if (!aiResponseText) {
      if (lang === 'bn') {
        aiResponseText = `প্রিয় ভাই/বোন, আপনার প্রশ্নটি অত্যন্ত গুরুত্বপূর্ণ ও জীবনঘনিষ্ঠ। 

পবিত্র কুরআন ও সুন্নাহ আমাদের শিক্ষা দেয় যে জীবনের যেকোনো দ্বিধা, দুশ্চিন্তা ও সংকটের মুহূর্তে আল্লাহর প্রজ্ঞার ওপর অগাধ ভরসা (*তাওয়াক্কুল*) রাখা এবং বিশুদ্ধ মাসনূন দু'আ ও আমল অবলম্বন করা আবশ্যক।

> *"আর যে ব্যক্তি আল্লাহর ওপর ভরসা করে, তার জন্য তিনিই যথেষ্ট।"* — **সূরা আত-ত্বালাক (৬৫:৩)**

**আপনার সমস্যার সমাধানে বাস্তবসম্মত কিছু পদক্ষেপ:**
১. **ধীরস্থিরভাবে পর্যালোচনা করুন:** আবেগের বশে তাৎক্ষণিক সিদ্ধান্ত না নিয়ে কিছু সময় শান্ত হয়ে পরিস্থিতির কারণ অনুসন্ধান করুন।
২. **সালাতুল ইস্তিখারাহ ও পরামর্শ:** কোনো সিদ্ধান্তে দ্বিধা থাকলে দু'রাকাত নফল নামায পড়ে ইস্তিখারার মাধ্যমে কল্যাণ প্রার্থনা করুন।
৩. **নিয়মিত ইস্তিগফার ও যিকির:** বেশি বেশি পড়ুন — *«লা হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ»* এবং *«হাসবুনাল্লাহু ওয়া নি'মাল ওয়াকীল»*।

---

### 🤲 এই মুহূর্তে পাঠের জন্য প্রমাণিত বিশুদ্ধ মাসনূন দু'আ (Authentic Prophetic Du'a)

**১. দুশ্চিন্তা ও মানসিক অস্থিরতা মুক্তির দু'আ:**
- 📜 **আরবি:** \`اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ\`
- 🗣️ **উচ্চারণ:** *আল্লাহুম্মা ইন্নি আ'ঊযু বিকা মিনাল হাম্মি ওয়াল হাযানি, ওয়াল 'আজযি ওয়াল কাসালি, ওয়াল বুখলি ওয়াল জুবনি, ওয়া দ্বালাইদ-দাইনি ওয়া গালাবাতির রিজাল।*
- 🇧🇩 **বাংলা অর্থ:** *"হে আল্লাহ! আমি আপনার আশ্রয় প্রার্থনা করছি দুশ্চিন্তা ও দুঃখ-বেদনা থেকে, অক্ষমতা ও অলসতা থেকে, কৃপণতা ও কাপুরুষতা থেকে, ঋণের বোঝা ও মানুষের দমন-পীড়ন থেকে।"*
- 🇬🇧 **English Meaning:** *"O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debt and from being overpowered by men."*
- 📚 **বিশুদ্ধ রেফারেন্স:** **[সহীহ বুখারী ৬৩৬৯ / Sahih al-Bukhari 6369]**

**২. যেকোনো কঠিন পরিস্থিতি সহজ হওয়ার দু'আ:**
- 📜 **আরবি:** \`اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً\`
- 🗣️ **উচ্চারণ:** *আল্লাহুম্মা লা সাহলা ইল্লা মা জা'আলতাহু সাহলান, ওয়া আনতা তাজ'আলুল হাযনা ইযা শি'তা সাহলান।*
- 🇧🇩 **বাংলা অর্থ:** *"হে আল্লাহ! কোনো বিষয়ই সহজ নয় কেবল আপনি যা সহজ করেন তা ব্যতীত; আর আপনি চাইলে কঠিন বিষয়কেও সহজ করে দিতে পারেন।"*
- 🇬🇧 **English Meaning:** *"O Allah, nothing is easy except what You make easy, and You can make grief/difficulty easy if You will."*
- 📚 **বিশুদ্ধ রেফারেন্স:** **[সহীহ ইবনে হিব্বান ৯৭৪, হিসনুল মুসলিম / Sahih Ibn Hibban 974]**

আপনার মনের প্রশান্তি ও উত্তম সমাধানের জন্য আল্লাহর কাছে আন্তরিক দু'আ রইল। আপনি চাইলে এ বিষয়ে আরও নির্দিষ্ট কোনো প্রশ্ন করতে পারেন।`;
      } else if (lang === 'banglish') {
        aiResponseText = `Bhai / Apu, apnar proshno ta onek beshi gurutto-purno o manobik. 

Quran o Sunnah amader shikhay je jibon-er jekono kothin poristhiti ba dushchintay shob shomoy Allah-r upor vorosha (*Tawakkul*) ebong dhoirjo (*Sabr*) dhora uchit.

> *"Ebong je Allah-r upor vorosha kore, tar jonno Allah-i jothesto."* — **Surah At-Talaq (65:3)**

**Apnar shomossha shomadhaner jonno 3-ti bastob-shommoto podokkhep:**
1. **Thanda mathay chinta korun:** Aabeger boshe kono hasty decision na niye ektu shomoy nin ebong shob kichu Allah-r hath-e chere din.
2. **Salatul Istikharah o Consultation:** Jekono shongshoy ba decision-e 2 rakat nofol namaz pore Istikharah korun ebong trusted manushder sathe kotha bolun.
3. **Istighfar o Dhikr:** Beshi beshi bolun — *«Hasbunallahu wa ni'mal wakeel»* ebong *«La hawla wa la quwwata illa billah»*.

---

### 🤲 Authentic Prophetic Masnoon Du'a (Prokrito Bishuddho Du'a)

**1. Dushchinta o Chinta theke Muktir Du'a (Anxiety & Grief):**
- 📜 **Arabic:** \`اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ\`
- 🗣️ **Transliteration:** *Allahumma inni a'udhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali, wal-bukhli wal-jubni, wa dala'id-dayni wa ghalabatir-rijal.*
- 🇧🇩 **Bangla Ortho:** *"He Allah! Ami apnar kache asroy chai dushchinta o kosto theke, okhomota o oloshota theke, kriponota o bhiruta theke, riner bojha o manusher chap theke."*
- 🇬🇧 **English Meaning:** *"O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debt and from being overpowered by men."*
- 📚 **Authentic Reference:** **[Sahih al-Bukhari 6369 / Sahih Bukhari 6369]**

**2. Kothin kaj Sohoj howar Du'a:**
- 📜 **Arabic:** \`اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً\`
- 🗣️ **Transliteration:** *Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla.*
- 🇧🇩 **Bangla Ortho:** *"He Allah! Kono kichui sohoj noy ja apni sohoj koren ta chara, ar apni chaile kothin kajeo sohoj baniye den."*
- 🇬🇧 **English Meaning:** *"O Allah, nothing is easy except that which You have made easy, and You can make difficulty easy if it be Your will."*
- 📚 **Authentic Reference:** **[Sahih Ibn Hibban 974 / Hisnul Muslim]**

Allah apnar mon-e shanti din ebong shomosshar shundor shomadhan kore din. Apnar aro kichu janar thakle nirdidhay bolte paren.`;
      } else {
        aiResponseText = `My dear brother/sister, your inquiry is deeply meaningful and valid. 

The Holy Quran reminds us that in moments of uncertainty and life trials, combining sincere prayer, reliant trust (*Tawakkul*), and wise patience (*Sabr*) opens paths we never imagined.

> *"And whoever relies upon Allah — then He is sufficient for him."* — **Surah At-Talaq (65:3)**

**A few practical steps to help resolve this:**
1. **Pause and Reframe:** Look at the situation through the lens of divine wisdom. What lesson or opportunity for personal growth is Allah presenting to you?
2. **Consultation and Istikharah:** Make 2 rak'ahs of prayer and ask Allah for clarity (*Istikharah*), and consult wise, trustworthy people in your circle.
3. **Consistent Dhikr & Supplication:** Keep your tongue moist with *Hasbunallahu wa ni'mal wakeel* (Allah is sufficient for us, and He is the best Disposer of affairs).

---

### 🤲 Authentic Prophetic Du'as with Verified Sources

**1. Du'a for Relief from Anxiety and Distress:**
- 📜 **Arabic:** \`اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ\`
- 🗣️ **Transliteration:** *Allahumma inni a'udhu bika minal-hammi wal-hazani, wal-'ajzi wal-kasali, wal-bukhli wal-jubni, wa dala'id-dayni wa ghalabatir-rijal.*
- 🇬🇧 **English Meaning:** *"O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debt and from being overpowered by men."*
- 🇧🇩 **Bangla Meaning:** *"হে আল্লাহ! আমি আপনার আশ্রয় প্রার্থনা করছি দুশ্চিন্তা ও দুঃখ-বেদনা থেকে, অক্ষমতা ও অলসতা থেকে, কৃপণতা ও কাপুরুষতা থেকে, ঋণের বোঝা ও মানুষের দমন-পীড়ন থেকে।"*
- 📚 **Authentic Source:** **[Sahih al-Bukhari 6369 / সহীহ বুখারী ৬৩৬৯]**

**2. Du'a for Ease in Hardship:**
- 📜 **Arabic:** \`اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً\`
- 🗣️ **Transliteration:** *Allahumma la sahla illa ma ja'altahu sahlan, wa anta taj'alul-hazna idha shi'ta sahlan.*
- 🇬🇧 **English Meaning:** *"O Allah, nothing is easy except what You make easy, and You can make grief/difficulty easy if You will."*
- 🇧🇩 **Bangla Meaning:** *"হে আল্লাহ! কোনো বিষয়ই সহজ নয় কেবল আপনি যা সহজ করেন তা ব্যতীত; আর আপনি চাইলে কঠিন বিষয়কেও সহজ করে দিতে পারেন।"*
- 📚 **Authentic Source:** **[Sahih Ibn Hibban 974, Hisn al-Muslim / সহীহ ইবনে হিব্বান ৯৭৪]**

May Allah grant you clarity, strength, and ease in this matter. Feel free to ask any further details or specific questions you are contemplating.`;
      }
    }

    return res.json({
      message: aiResponseText,
      detected_lang: lang,
      versesReferenced: finalVerses.map((v) => v.ref),
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: 'Failed to process chat message. Please try again.' });
  }
});

// Vite middleware / static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hikmah AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
