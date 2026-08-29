import React from 'react';
import { BookOpen, ShieldCheck, HeartHandshake, Sparkles, MessageSquareHeart } from 'lucide-react';

interface HeaderProps {
  currentLang: 'en' | 'bn';
  onLangChange: (lang: 'en' | 'bn') => void;
  activeTab: 'reflect' | 'chat' | 'browse';
  onTabChange: (tab: 'reflect' | 'chat' | 'browse') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLangChange,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/10">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900 font-serif-heading">
                Hikmah AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-medium border border-emerald-200/50">
                حِكْمَة
              </span>
            </div>
            <p className="text-xs text-stone-700">
              {currentLang === 'bn'
                ? 'কুরআনিক প্রতিচ্ছবি ও মানসিক সান্ত্বনা'
                : 'Quranic Reflection & Contemplation'}
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Tabs */}
          <div className="flex bg-stone-200/70 p-1 rounded-xl text-xs sm:text-sm font-medium">
            <button
              id="tab-reflect"
              onClick={() => onTabChange('reflect')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reflect'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'bn' ? 'প্রতিচ্ছবি' : 'Reflect'}</span>
            </button>
            <button
              id="tab-chat"
              onClick={() => onTabChange('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'bn' ? 'হিকমাহ চ্যাট' : 'Counselor Chat'}</span>
            </button>
            <button
              id="tab-browse"
              onClick={() => onTabChange('browse')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'browse'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'bn' ? 'বিষয়ভিত্তিক আয়াত' : 'Themes'}</span>
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-semibold shadow-xs">
            <button
              id="lang-en"
              onClick={() => onLangChange('en')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentLang === 'en'
                  ? 'bg-emerald-700 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              EN
            </button>
            <button
              id="lang-bn"
              onClick={() => onLangChange('bn')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentLang === 'bn'
                  ? 'bg-emerald-700 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
