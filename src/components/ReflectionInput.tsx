import React, { useState } from 'react';
import { Send, Sparkles, HelpCircle, Compass, RefreshCw } from 'lucide-react';
import { formatThemeName, getThemeBanglaName } from '../utils';

interface ReflectionInputProps {
  currentLang: 'en' | 'bn';
  isLoading: boolean;
  onSubmit: (message: string, selectedThemes: string[], responseLang: 'auto' | 'en' | 'bn') => void;
  availableThemes: { key: string; name: string }[];
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
  availableThemes,
  initialText = '',
}) => {
  const [text, setText] = useState(initialText);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
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
    onSubmit(text.trim(), selectedThemes, responseLang);
  };

  const toggleTheme = (key: string) => {
    setSelectedThemes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-xs mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="reflection-textarea"
              className="text-sm font-semibold text-stone-900 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                {currentLang === 'bn'
                  ? 'আপনার মনের অনুভূতি বা পরিস্থিতি শেয়ার করুন'
                  : 'What is on your heart or mind today?'}
              </span>
            </label>
            <span className="text-xs text-stone-600">
              {currentLang === 'bn' ? 'বাংলা বা ইংরেজিতে লিখুন' : 'English or Bangla supported'}
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
                  ? 'যেমন: "আমি চাকরি হারিয়েছি এবং পরিবারের খরচ নিয়ে খুব চিন্তিত..." অথবা "আমার অন্তরে শান্তি পাচ্ছি না..."'
                  : 'e.g., "I just lost my job and I am anxious about how to support my family..." or "I feel lonely and need strength..."'
              }
              className="w-full p-4 rounded-2xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder:text-stone-600 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all outline-none resize-y text-base"
            />
          </div>
        </div>

        {/* Thematic filters (optional tags) */}
        <div>
          <div className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-stone-400" />
            <span>
              {currentLang === 'bn'
                ? 'প্রাসঙ্গিক বিষয় নির্বাচন করুন (ঐচ্ছিক):'
                : 'Optional theme focus:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 pb-1">
            {availableThemes.map((t) => {
              const isSelected = selectedThemes.includes(t.key);
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => toggleTheme(t.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    isSelected
                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  {currentLang === 'bn' ? getThemeBanglaName(t.key) : t.name}
                </button>
              );
            })}
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
