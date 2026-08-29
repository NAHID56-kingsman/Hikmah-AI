import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HeartHandshake,
  Languages,
  Globe,
} from 'lucide-react';
import { Verse, ChatMessage } from '../types';

interface QuranicChatbotProps {
  userContext?: string;
  verses?: Verse[];
  currentLang: 'en' | 'bn' | 'banglish';
  initialPrompt?: string;
  isStandalone?: boolean;
}

const AUTHENTIC_DUA_CHIPS_EN = [
  { label: '🤲 Du’a for Anxiety & Distress', prompt: 'Please provide the authentic Prophetic Du’a for anxiety, grief, and distress with Arabic, transliteration, English, Bangla, and Hadith reference.' },
  { label: '🕊️ Du’a for Hardship & Ease', prompt: 'Give me the authentic Sahih Du’a for making difficult matters easy with full Arabic, transliteration, English, Bangla, and citation.' },
  { label: '💡 Du’a for Guidance & Istikharah', prompt: 'What is the authentic Du’a and Sunnah method for making an important life decision (Salatul Istikharah)?' },
  { label: '🌿 Master Forgiveness (Sayyidul Istighfar)', prompt: 'Share the authentic Sayyidul Istighfar (Chief of Prayers for Forgiveness) from Sahih Bukhari with Arabic, English, and Bangla.' },
  { label: '💔 Du’a of Prophet Yunus (In Distress)', prompt: 'Provide the authentic Du’a of Prophet Yunus (AS) in the belly of the whale with English, Bangla meaning, and its virtues.' },
  { label: '🌙 Du’a for Overcoming Anger & Calming Heart', prompt: 'What authentic Du’a and Sunnah steps did the Prophet (peace be upon him) teach for controlling anger and soothing the heart?' },
];

const AUTHENTIC_DUA_CHIPS_BN = [
  { label: '🤲 দুশ্চিন্তা ও মানসিক অস্থিরতা মুক্তির দু’আ', prompt: 'অনুগ্রহ করে দুশ্চিন্তা, দুঃখ ও মানসিক অস্থিরতা থেকে মুক্তির বিশুদ্ধ মাসনূন দু’আটি আরবি, উচ্চারণ, বাংলা অর্থ, ইংরেজি অর্থ ও হাদীস রেফারেন্সসহ দিন।' },
  { label: '🕊️ কঠিন পরিস্থিতি সহজ হওয়ার দু’আ', prompt: 'কঠিন বিষয় সহজ হওয়ার জন্য প্রমাণিত বিশুদ্ধ সহীহ হাদীসের দু’আটি পূর্ণাঙ্গভাবে বাংলা ও ইংরেজিসহ উপহার দিন।' },
  { label: '💡 সঠিক সিদ্ধান্ত ও ইস্তিখারার দু’আ', prompt: 'জীবনের গুরুত্বপূর্ণ সিদ্ধান্ত গ্রহণের জন্য সালাতুল ইস্তিখারার নিয়ম ও বিশুদ্ধ মাসনূন দু’আটি বুঝিয়ে বলুন।' },
  { label: '🌿 শ্রেষ্ঠ ক্ষমা প্রার্থনার দু’আ (সাইয়্যিদুল ইস্তিগফার)', prompt: 'সহীহ বুখারীতে বর্ণিত সাইয়্যিদুল ইস্তিগফার (শ্রেষ্ঠ ইস্তিগফার) দু’আটি আরবি, উচ্চারণ, বাংলা ও ইংরেজি অর্থসহ প্রদান করুন।' },
  { label: '💔 বিপদ ও সংকটে ইউনুস (আ.)-এর দু’আ', prompt: 'মাছের পেটে থাকা অবস্থায় হযরত ইউনুস (আ.)-এর সেই মহিমান্বিত দু’আটি এবং এর ফযিলত বাংলা ও ইংরেজিতে উল্লেখ করুন।' },
  { label: '🌙 রাগ নিয়ন্ত্রণ ও মনের প্রশান্তির দু’আ', prompt: 'অতিরিক্ত রাগ নিয়ন্ত্রণ ও অন্তরে প্রশান্তি আনার জন্য সুন্নাহ সম্মত আমল ও বিশুদ্ধ মাসনূন দু’আ উল্লেখ করুন।' },
];

const AUTHENTIC_DUA_CHIPS_BANGLISH = [
  { label: '🤲 Dushchinta Muktir Authentic Dua', prompt: 'Dushchinta o moner kosto theke muktir jonno authentic Sahih Hadith-er masnoon Dua-ti Arabic, Transliteration, Bangla o English meaning shoho din.' },
  { label: '🕊️ Kothin kaj Sohoj howar Dua', prompt: 'Kono kothin poristhiti sohoj howar jonno authentic Hadith-er Dua-ti reference shoho share korun.' },
  { label: '💡 Istikharah o Decision Making Dua', prompt: 'Important decision neyar jonno Salatul Istikharah-r niyom o authentic Dua-ti bujhiye bolun.' },
  { label: '🌿 Sayyidul Istighfar (Khoma Prarthona)', prompt: 'Sahih Bukhari-r Sayyidul Istighfar Dua-ti Arabic, transliteration, Bangla o English meaning shoho din.' },
  { label: '💔 Bipod-e Prophet Yunus (AS)-er Dua', prompt: 'Bipod o kothin shomoy-e Hazrat Yunus (AS)-er Dua-ti (La ilaha illa anta...) ebong er fojilot share korun.' },
  { label: '🌙 Rag Niyontron o Shanti pawar Dua', prompt: 'Rag control kora o mon-e shanti pawar jonno authentic Masnoon Dua o Sunnah amol bolun.' },
];

export const QuranicChatbot: React.FC<QuranicChatbotProps> = ({
  userContext = '',
  verses = [],
  currentLang,
  initialPrompt,
  isStandalone = false,
}) => {
  const [selectedLangMode, setSelectedLangMode] = useState<'auto' | 'en' | 'bn' | 'banglish'>('auto');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [showDuaLibrary, setShowDuaLibrary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine active display language for UI labels
  const activeUiLang = selectedLangMode === 'auto' ? currentLang : selectedLangMode;

  // Initialize welcoming message
  useEffect(() => {
    let welcomeText = '';
    const hasContext = userContext && userContext.trim().length > 0;

    if (activeUiLang === 'bn') {
      if (hasContext) {
        welcomeText = `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ। আমি **হিকমাহ এআই** — আপনার ইসলামিক মেন্টর ও কাউন্সেলর। 

আপনার পরিস্থিতি (*"${userContext.slice(0, 80)}${userContext.length > 80 ? '...' : ''}"*) ও কুরআনের আয়াতের আলোকে আপনার যেকোনো দ্বিধা, মানসিক অস্থিরতা বা নির্দিষ্ট প্রশ্নের উত্তর খুঁজতে আমি প্রস্তুত। 

আমি সবসময় **বিশুদ্ধ প্রমাণিত মাসনূন দু'আ (আরবি, উচ্চারণ, বাংলা ও ইংরেজি অর্থ এবং হাদীস রেফারেন্সসহ)** ও কুরআন-সুন্নাহর আলোকে মানবিক সহমর্মিতার সাথে উত্তর প্রদান করি। 

আপনি চাইলে **English বা বাংলা** — যেকোনো ভাষায় লিখতে পারেন।`;
      } else {
        welcomeText = `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ। আমি **হিকমাহ এআই** — আপনার ব্যক্তিগত ইসলামিক কাউন্সেলর ও প্রজ্ঞাময় পথপ্রদর্শক।

যেকোনো দ্বিধা, মানসিক চাপ, পারিবারিক জটিলতা, জীবনের কঠিন সিদ্ধান্ত কিংবা ইসলামিক পরামর্শের বিষয়ে সরাসরি আমার সাথে কথা বলুন। 

✨ **আমার বৈশিষ্ট্য ও প্রতিজ্ঞা:**
- পবিত্র কুরআন ও বিশুদ্ধ সুন্নাহর আলোকে মানবিক সহানুভূতিশীল কাউন্সেলিং
- **বিশুদ্ধ প্রমাণিত মাসনূন দু'আ** (হরকতসহ আরবি, উচ্চারণ, বাংলা অর্থ, ইংরেজি অর্থ ও সহীহ রেফারেন্স)
- কোনো মনগড়া বা অপ্রমাণিত তথ্য পরিহার করে নির্ভরযোগ্য দিকনির্দেশনা

আপনি **English বা বাংলা** — যেকোনো ভাষায় আপনার মনের কথা আমাকে বলতে পারেন।`;
      }
    } else if (activeUiLang === 'banglish') {
      if (hasContext) {
        welcomeText = `As-salamu alaykum wa Rahmatullah. Ami **Hikmah AI** — apnar Islamic mentor o counselor.

Apnar situation (*"${userContext.slice(0, 80)}${userContext.length > 80 ? '...' : ''}"*) ebong Quranic Ayat-er aloke jekono question ba shomosshar shomadhan khujte ami ready.

Ami shob shomoy **Authentic Masnoon Du'as (Arabic, Transliteration, Bangla & English meanings, and verified Hadith references)** shoho shundor shomadhan provide kori.

Apni **English ba Bangla** — jekono vashay likhte paren!`;
      } else {
        welcomeText = `As-salamu alaykum wa Rahmatullah! Ami **Hikmah AI** — apnar dedicated Islamic Counselor & Companion.

Apnar moner jekono kotha, dushchinta, kosto, family problem ba life decision niye direct amr sathe kotha bolte paren before asking anything.

✨ **Amader Khash Boishishto:**
- Quran o Sahih Sunnah-r aloke human-like empathy & shomadhan
- **100% Authentic Prophetic Masnoon Du'as** (Arabic text, Transliteration, Bangla & English meaning, and Hadith reference)
- Kono unverified ba fabricated dua deya hoy na

Apni **English ba Bangla** — jekono vashay apnar moner kotha bolun!`;
      }
    } else {
      if (hasContext) {
        welcomeText = `As-salamu alaykum wa Rahmatullah. I am **Hikmah AI** — your companion and Quranic counselor.

Having reflected on your situation (*"${userContext.slice(0, 80)}${userContext.length > 80 ? '...' : ''}"*), I am here to discuss any follow-up questions, personal dilemmas, or practical steps you need.

I strictly provide **authentic Prophetic Du'as (with complete Arabic, transliteration, English & Bangla translations, and verified Hadith references)** alongside empathetic Quranic reasoning.

You can ask in **English or Bangla**!`;
      } else {
        welcomeText = `As-salamu alaykum wa Rahmatullah. I am **Hikmah AI** — your dedicated Islamic counselor and compassionate reflection companion.

You can talk to me directly about whatever is on your mind — emotional stress, life dilemmas, family challenges, decision-making (*Istikharah*), or seeking spiritual clarity before asking anything.

✨ **Core Commitments:**
- Empathetic, human-like counseling rooted in the Holy Quran & authentic Sunnah
- **100% Authentic Prophetic Du'as** (complete with Arabic text, transliteration, dual English & Bangla meanings, and verified Hadith/Quran citations)
- No fabricated, random, or unverified supplications

Feel free to write in **English or Bangla (বাংলা)** — I will converse in your preferred language.`;
      }
    }

    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toISOString(),
        detected_lang: activeUiLang,
      },
    ]);
  }, [userContext, activeUiLang]);

  // Handle external initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message history to /api/chat
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          user_context: userContext,
          verses: verses,
          preferredLanguage: selectedLangMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get guidance response');
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        detected_lang: data.detected_lang,
        versesReferenced: data.versesReferenced,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          activeUiLang === 'bn'
            ? 'দুঃখিত, উত্তর তৈরিতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : activeUiLang === 'banglish'
            ? 'Dukkhito, answer toiri korte problem hoyeche. Onugroho kore abar try korun.'
            : 'I apologize, I encountered a temporary connection issue. Please try sending your question again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string, lang?: 'en' | 'bn' | 'banglish') => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown characters
    const cleanText = text
      .replace(/[*#>`_~-]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeakingId(null);
    let welcomeText = '';
    if (activeUiLang === 'bn') {
      welcomeText = `কথোপকথন নতুন করে শুরু করা হয়েছে। আপনার মনে থাকা যেকোনো বিষয় বা প্রশ্ন আমাকে জানান (English বা বাংলা এ)।`;
    } else if (activeUiLang === 'banglish') {
      welcomeText = `Chat notun kore shuru kora holo. Apnar moner jekono proshno ba kotha amake bolte paren.`;
    } else {
      welcomeText = `Conversation reset. Feel free to ask any question or describe what is on your mind in English or Bangla.`;
    }

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toISOString(),
        detected_lang: activeUiLang,
      },
    ]);
  };

  return (
    <div
      id="quranic-chatbot-section"
      className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col transition-all"
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-stone-900 px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-emerald-300 shadow-xs shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight">
                {activeUiLang === 'bn'
                  ? 'কুরআনিক সমাধান ও পরামর্শ চ্যাট'
                  : activeUiLang === 'banglish'
                  ? 'Quranic Counselor & Shomadhan Chat'
                  : 'Quranic Counselor & Guidance Chat'}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {activeUiLang === 'bn' ? 'লাইভ চ্যাট' : 'Live Dialogue'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              {activeUiLang === 'bn'
                ? 'English ও বাংলা — আপনার ভাষার ধরন অনুযায়ী মানুষের মতো প্রজ্ঞাপূর্ণ সমাধান'
                : activeUiLang === 'banglish'
                ? 'English o Bangla — apnar vasha onujayi shundor o proggapurno shomadhan'
                : 'Understands and replies fluently in English & বাংলা (Bangla)'}
            </p>
          </div>
        </div>

        {/* Reset button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleResetChat}
            title={activeUiLang === 'bn' ? 'চ্যাট নতুন করে শুরু করুন' : 'Reset Conversation'}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{activeUiLang === 'bn' ? 'নতুন করে শুরু' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Authentic Sunnah Du'as Quick Bank & Suggested Questions */}
      <div className="bg-stone-50/95 border-b border-stone-200/80 px-4 py-3 space-y-3">
        {/* Authentic Duas Category Bar */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              <span className="text-base">🤲</span>
              <span>
                {activeUiLang === 'bn'
                  ? 'প্রমাণিত বিশুদ্ধ মাসনূন দু’আ (Authentic Hadith Du’as):'
                  : activeUiLang === 'banglish'
                  ? 'Bishuddho Authentic Masnoon Du’a Library:'
                  : 'Authentic Sunnah Du’as (Verified with Hadith References):'}
              </span>
            </div>
            <span className="text-[10px] bg-emerald-100/90 text-emerald-900 px-2 py-0.5 rounded-full font-medium border border-emerald-300/60 hidden sm:inline-block">
              {activeUiLang === 'bn' ? 'আরবি • বাংলা • English • সহীহ রেফারেন্স' : 'Arabic • বাংলা • English • Citations'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {(activeUiLang === 'bn'
              ? AUTHENTIC_DUA_CHIPS_BN
              : activeUiLang === 'banglish'
              ? AUTHENTIC_DUA_CHIPS_BANGLISH
              : AUTHENTIC_DUA_CHIPS_EN
            ).map((chip, idx) => (
              <button
                key={`dua-chip-${idx}`}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isLoading}
                className="text-xs bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 border border-emerald-200/80 hover:border-emerald-400 px-2.5 py-1.5 rounded-xl font-medium transition-all shadow-xs disabled:opacity-50 text-left flex items-center gap-1.5"
              >
                <span className="truncate">{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="p-4 sm:p-5 space-y-4 max-h-[520px] overflow-y-auto bg-stone-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-stone-800 text-white'
                    : 'bg-emerald-700 text-white border border-emerald-800'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-white border border-stone-200/90 text-stone-800 rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-2">
                    {/* Detected Language Tag if present */}
                    {msg.detected_lang && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 w-fit px-2 py-0.5 rounded-md border border-emerald-200/60 mb-2">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>
                          {msg.detected_lang === 'en'
                            ? 'English Response'
                            : 'বাংলায় উত্তর'}
                        </span>
                      </div>
                    )}

                    <div className="prose prose-stone prose-xs max-w-none dark:prose-invert">
                      <Markdown>{msg.content}</Markdown>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 mt-2 border-t border-stone-100 text-stone-400">
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.content, msg.detected_lang)}
                        title={isSpeakingId === msg.id ? 'Stop audio' : 'Listen audio'}
                        className="p-1 rounded-md hover:bg-stone-100 hover:text-stone-700 transition-colors"
                      >
                        {isSpeakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        title="Copy answer"
                        className="p-1 rounded-md hover:bg-stone-100 hover:text-stone-700 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {activeUiLang === 'bn'
                  ? 'কুরআনের আলোকে চিন্তা করে উত্তর তৈরি হচ্ছে...'
                  : activeUiLang === 'banglish'
                  ? 'Quran-er wisdom theke chinta kore shomadhan toiri hocche...'
                  : 'Reasoning thoughtfully from Quranic wisdom...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              id="quranic-chat-input"
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeUiLang === 'bn'
                  ? 'আপনার প্রশ্ন বা বিস্তারিত সমস্যা লিখুন (যেমন: রাগ নিয়ন্ত্রণ করতে পারছি না, কীভাবে সবর করব?)...'
                  : activeUiLang === 'banglish'
                  ? 'Apnar proshno ba somossar kotha likhun (e.g. "ami kivabe amar family problem solve korbo?")...'
                  : 'Ask in English or Bangla (e.g. "How do I deal with grief?" or "amar khub kosto hocche")...'
              }
              className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            id="quranic-chat-submit-btn"
            disabled={!inputMessage.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shrink-0 transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-600 px-1 pt-1.5 gap-1">
          <span>
            {activeUiLang === 'bn'
              ? 'Enter চাপুন সেন্ড করতে, Shift+Enter নতুন লাইনের জন্য'
              : activeUiLang === 'banglish'
              ? 'Enter press korun send korte, Shift+Enter new line-er jonno'
              : 'Press Enter to send, Shift+Enter for new line'}
          </span>
          <span className="text-emerald-700 font-medium">
            English • বাংলা
          </span>
        </div>
      </div>
    </div>
  );
};
