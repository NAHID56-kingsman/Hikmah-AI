import React, { useState } from 'react';
import { Send, Sparkles, RefreshCw } from 'lucide-react';

interface ReflectionInputProps {
  currentLang: 'en' | 'bn';
  isLoading: boolean;
  onSubmit: (message: string, selectedThemes: string[], responseLang: 'auto' | 'en' | 'bn') => void;
  availableThemes?: { key: string; name: string }[];
  initialText?: string;
}

const SAMPLE_PROMPTS_EN = [
  "I'm feeling overwhelmed with anxiety about my future and job.",
  "I'm struggling to maintain patience during a hard hardship.",
  "I feel very lonely and like nobody understands what I'm facing.",
  "How can I rebuild hope and trust in Allah's mercy?",
  "I'm dealing with marriage and family conflicts right now.",
  "I want to cultivate deep gratitude even during tough days.",
];

const SAMPLE_PROMPTS_BN = [
  "আমি ভবিষ্যৎ এবং চাকরি নিয়ে খুব দুশ্চিন্তায় আছি।",
  "কঠিন পরিস্থিতিতে ধৈর্য ধরে রাখতে কষ্ট হচ্ছে।",
  "আমি নিজেকে খুব একা এবং নিঃসঙ্গ মনে করছি।",
  "আল্লাহর রহমতের প্রতি কীভাবে পুনরায় আশা ও ভরসা জাগাব?",
  "পারিবারিক ও দাম্পত্য জীবনে অশান্তি চলছে।",
  "কঠিন সময়েও কীভাবে অন্তরে শোকর ও কৃতজ্ঞতা বজায় রাখব?",
];

export const ReflectionInput: React.FC<ReflectionInputProps> = ({
  currentLang,
  isLoading,
  onSubmit,
  initialText = '',
}) => {
  const [text, setText] = useState(initialText);
  const [responseLang, setResponseLang] = useState<'auto' | 'en' | 'bn'>(currentLang);

  // Sync initialText if updated
  React.useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Keep synced if user switches main language
  React.useEffect(() => {
    setResponseLang(currentLang);
  }, [currentLang]);

  const samplePrompts = currentLang === 'bn' ? SAMPLE_PROMPTS_BN : SAMPLE_PROMPTS_EN;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSubmit(text.trim(), [], responseLang);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-xs mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="reflection-textarea"
              className="text-base font-semibold text-stone-900 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                {currentLang === 'bn'
                  ? 'আজ আপনার মনের অনুভূতি বা হৃদয়ের কথা কি?'
                  : 'What is on your heart or mind today?'}
              </span>
            </label>
            <span className="text-xs text-stone-500 font-medium">
              {currentLang === 'bn' ? 'বাংলা বা ইংরেজিতে লিখুন' : 'English or Bangla'}
            </span>
          </div>

          <div className="relative">
            <textarea
              id="reflection-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
              rows={4}
              placeholder={
                currentLang === 'bn'
                  ? 'একটি শান্ত শ্বাস নিন এবং নিজের কথা লিখুন... যেমন: "আমি ভবিষ্যৎ নিয়ে একটু চিন্তিত, মনের শান্তি ও অবিচলতা খুঁজছি..." অথবা "আজ আল্লাহর রহমতের জন্য অন্তরে শোকর অনুভব করছি..."'
                  : 'Take a gentle breath and share whatever is on your heart... e.g., "I\'ve been feeling exhausted with work and seeking peace of mind," or "I want to renew my trust in Allah\'s wisdom during this life transition."'
              }
              className="w-full p-4 rounded-2xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder:text-stone-500 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all outline-none resize-y text-base"
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Reflection Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-medium">
              {currentLang === 'bn' ? 'প্রতিচ্ছবির ভাষা:' : 'Response in:'}
            </span>
            <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                id="response-lang-bn"
                onClick={() => setResponseLang('bn')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  responseLang === 'bn'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                বাংলা (Bangla)
              </button>
              <button
                type="button"
                id="response-lang-en"
                onClick={() => setResponseLang('en')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  responseLang === 'en'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                id="response-lang-auto"
                onClick={() => setResponseLang('auto')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  responseLang === 'auto'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          <button
            id="submit-reflection-btn"
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              !text.trim() || isLoading
                ? 'bg-stone-200 text-stone-600 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow-md cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{responseLang === 'bn' || currentLang === 'bn' ? 'অন্বেষণ ও ভাবা হচ্ছে...' : 'Reflecting...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{responseLang === 'bn' || currentLang === 'bn' ? 'প্রতিচ্ছবি দেখুন' : 'Seek Reflection'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Prompts */}
      <div className="mt-6 pt-5 border-t border-stone-100">
        <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5">
          {currentLang === 'bn' ? 'উদাহরণ ভাবনা বা প্রশ্ন:' : 'Thought Starters:'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {samplePrompts.slice(0, 4).map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(prompt)}
              className="text-left text-xs p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-200/60 hover:border-emerald-200 text-stone-700 hover:text-emerald-900 transition-colors line-clamp-2"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
