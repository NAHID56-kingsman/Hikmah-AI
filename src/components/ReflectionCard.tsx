import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  BookOpen,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
} from 'lucide-react';
import { ReflectionResponse } from '../types';
import { VerseCard } from './VerseCard';

interface ReflectionCardProps {
  data: ReflectionResponse;
  currentLang: 'en' | 'bn' | 'banglish';
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({ data, currentLang }) => {
  const [displayedText, setDisplayedText] = useState(data.reflection);
  const [activeTextLang, setActiveTextLang] = useState<'en' | 'bn' | 'banglish'>(data.detected_lang || currentLang);
  const [copied, setCopied] = useState(false);
  const [showAllRelatable, setShowAllRelatable] = useState(false);
  const [relatableSearch, setRelatableSearch] = useState('');

  // Whenever brand new reflection data arrives from an API request
  useEffect(() => {
    const initialLang = data.detected_lang || currentLang;
    setDisplayedText(data.reflection);
    setActiveTextLang(initialLang);
    setShowAllRelatable(false);
    setRelatableSearch('');
  }, [data, currentLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allRelatableList = data.all_relatable_verses || data.verses || [];
  const filteredRelatable = allRelatableList.filter((v) => {
    if (!relatableSearch.trim()) return true;
    const q = relatableSearch.toLowerCase().trim();
    return (
      v.english?.toLowerCase().includes(q) ||
      v.bangla?.toLowerCase().includes(q) ||
      v.arabic?.includes(q) ||
      v.surah_name_en?.toLowerCase().includes(q) ||
      v.surah_name_translit?.toLowerCase().includes(q) ||
      v.ref?.toLowerCase().includes(q)
    );
  });

  return (
    <div id="reflection-response-container" className="space-y-6 mb-10 animate-fade-in">
      {/* Context Summary Header */}
      <div className="bg-emerald-950 text-emerald-50 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{activeTextLang === 'bn' ? 'কুরআনিক প্রতিচ্ছবি ও প্রজ্ঞা' : 'Quranic Reflection & Solace'}</span>
          </div>

          <blockquote className="text-base sm:text-lg font-serif-heading italic text-emerald-100/95 border-l-2 border-emerald-500 pl-4 py-1">
            "{data.user_message}"
          </blockquote>

          {/* Identified Topics Badges */}
          {data.matched_topics && data.matched_topics.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-emerald-300 font-medium mr-1">
                {activeTextLang === 'bn' ? 'চিহ্নিত বিষয়সমূহ:' : 'Identified Topics:'}
              </span>
              {data.matched_topics.map((top) => (
                <span
                  key={top.key}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 shadow-2xs"
                >
                  <span>{activeTextLang === 'bn' ? top.nameBn : top.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-black/20 px-1 rounded-full">
                    {top.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Retrieved Verses Section */}
      {data.verses && data.verses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                {activeTextLang === 'bn'
                  ? `মূল উদ্ধৃত কুরআনের আয়াতসমূহ (${data.verses.length}টি)`
                  : `Primary Retrieved Quranic Verses (${data.verses.length})`}
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              {activeTextLang === 'bn' ? 'আরবি, বাংলা ও ইংরেজি অনুবাদ সহ' : 'Arabic, Bangla & English with Recitation'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.verses.map((verse) => (
              <VerseCard key={verse.ref} verse={verse} currentLang={activeTextLang} />
            ))}
          </div>

          {/* All Relatable Verses from the whole Quran banner / toggle */}
          {allRelatableList.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-stone-50 rounded-2xl border border-emerald-200/80 p-4 sm:p-5 mt-4 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      {activeTextLang === 'bn'
                        ? `সমগ্র কুরআন থেকে সম্পর্কিত সকল আয়াত (${data.total_relatable_count || allRelatableList.length}টি পাওয়া গেছে)`
                        : `All Relatable Verses from Across Whole Quran (${data.total_relatable_count || allRelatableList.length} found)`}
                    </h4>
                    <p className="text-xs text-stone-600">
                      {activeTextLang === 'bn'
                        ? 'আপনার বিষয়ের সাথে প্রাসঙ্গিক সমগ্র কুরআনের সকল লাইন দেখুন'
                        : 'Explore all lines and passages across the 114 Surahs relatable to your topic'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="toggle-all-relatable-btn"
                  onClick={() => setShowAllRelatable(!showAllRelatable)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-700 hover:text-white transition-all shadow-xs"
                >
                  <span>
                    {showAllRelatable
                      ? activeTextLang === 'bn'
                        ? 'সংক্ষেপ করুন'
                        : 'Hide Relatable Lines'
                      : activeTextLang === 'bn'
                      ? `সকল সম্পর্কিত আয়াত দেখুন (${allRelatableList.length})`
                      : `Show All Relatable Lines (${allRelatableList.length})`}
                  </span>
                  {showAllRelatable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded list of all relatable lines */}
              {showAllRelatable && (
                <div className="mt-5 pt-4 border-t border-emerald-200/70 space-y-4">
                  {/* Filter inside relatable verses */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={relatableSearch}
                      onChange={(e) => setRelatableSearch(e.target.value)}
                      placeholder={
                        activeTextLang === 'bn'
                          ? 'সম্পর্কিত আয়াতসমূহের মধ্যে খুঁজুন...'
                          : 'Filter within relatable verses (e.g., surah name, word)...'
                      }
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 max-h-[700px] overflow-y-auto pr-1">
                    {filteredRelatable.map((verse) => (
                      <VerseCard key={`relatable-${verse.ref}`} verse={verse} currentLang={activeTextLang} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-stone-600 text-xs flex items-center gap-3">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            {activeTextLang === 'bn'
              ? 'এই সুনির্দিষ্ট বর্ণনার সাথে সম্পর্কিত আয়াতসমূহ নিচে বিশদভাবে তাদাব্বুর করা হয়েছে।'
              : 'The reflections and spiritual wisdom regarding your message are detailed below.'}
          </span>
        </div>
      )}

      {/* Reflection Commentary */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">
                {activeTextLang === 'bn' ? 'সহমর্মিতামূলক প্রতিচ্ছবি ও শিক্ষা' : 'Reflective Commentary'}
              </h3>
              <p className="text-xs text-stone-500">
                {activeTextLang === 'bn' ? 'কুরআনের আয়াতে আপনার পরিস্থিতির গভীর প্রতিফলন' : 'Tafakkur & personal solace through the Quranic lens'}
              </p>
            </div>
          </div>

          {/* Action Tools: Copy Reflection */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 transition-colors border border-stone-200"
              title={activeTextLang === 'bn' ? 'কপি করুন' : 'Copy Reflection'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (activeTextLang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (activeTextLang === 'bn' ? 'কপি' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Formatted Markdown Commentary */}
        <div
          className={`prose prose-stone max-w-none text-stone-800 text-sm sm:text-base leading-relaxed space-y-4 ${
            activeTextLang === 'bn' ? 'font-bangla text-base sm:text-lg' : ''
          }`}
        >
          <div className="markdown-body">
            <Markdown>{displayedText}</Markdown>
          </div>
        </div>

        {/* Scholar notice disclaimer */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-start gap-2.5 text-xs text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-200/60">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p>
            {activeTextLang === 'bn'
              ? 'এটি একটি ব্যক্তিগত ভাবনা ও আধ্যাত্মিক সহমর্মিতা। এটি কোনো আইনি ধর্মীয় ফতোয়া বা আলেমদের আনুষ্ঠানিক মতামতের বিকল্প নয়। গভীর ইসলামি নির্দেশের জন্য নির্ভরযোগ্য আলেমদের সাথে পরামর্শ করুন।'
              : 'This reflection is intended for emotional solace, contemplation, and spiritual mindfulness. It does not constitute a formal Islamic ruling (fatwa) or scholarly decree. For formal religious guidance, please consult a qualified Islamic scholar.'}
          </p>
        </div>
      </div>
    </div>
  );
};

