import React, { useState, useEffect } from 'react';
import { Search, Compass, BookOpen, Filter, Sparkles, RefreshCw, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Verse, ThemeCategory } from '../types';
import { VerseCard } from './VerseCard';
import { formatThemeName, getThemeBanglaName } from '../utils';

interface ThemesBrowserProps {
  currentLang: 'en' | 'bn';
  onSelectPrompt?: (promptText: string) => void;
}

export const ThemesBrowser: React.FC<ThemesBrowserProps> = ({ currentLang, onSelectPrompt }) => {
  const [themes, setThemes] = useState<{ key: string; name: string; verses: string[]; keywords: string[] }[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('patience_and_hardship');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSurah, setSelectedSurah] = useState<string>('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  // Load themes
  useEffect(() => {
    fetch('/api/themes')
      .then((res) => res.json())
      .then((data) => {
        setThemes(data);
        if (data.length > 0 && !selectedTheme) {
          setSelectedTheme(data[0].key);
        }
      })
      .catch((err) => console.error('Failed to load themes', err));
  }, []);

  // Load verses based on selected theme or search query
  useEffect(() => {
    setIsLoading(true);
    let url = '/api/verses';
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    } else if (selectedTheme) {
      params.append('theme', selectedTheme);
    }

    if (selectedSurah) {
      params.append('surah', selectedSurah);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.verses)) {
          setVerses(data.verses);
          setTotalCount(data.total || data.verses.length);
        } else if (Array.isArray(data)) {
          setVerses(data);
          setTotalCount(data.length);
        } else {
          setVerses([]);
          setTotalCount(0);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load verses', err);
        setIsLoading(false);
      });
  }, [selectedTheme, searchQuery, selectedSurah]);

  const displayedVerses = verses.slice(0, displayLimit);
  const hasMore = verses.length > displayLimit;

  const currentThemeObj = themes.find((t) => t.key === selectedTheme);

  return (
    <div className="space-y-6">
      {/* Search & Topic Selector */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="theme-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayLimit(20);
              }}
              placeholder={
                currentLang === 'bn'
                  ? 'সমগ্র কুরআন থেকে খুঁজুন (যেমন: ধৈর্য, 2:153, রহমত, patience, forgiveness)...'
                  : 'Search across the whole Quran by keyword, topic, or Ayah ref (e.g., 2:153, patience, mercy)...'
              }
              className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-500 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-stone-900 bg-stone-200/70 px-2 py-0.5 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Theme Pills */}
        {!searchQuery && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-600 mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentLang === 'bn' ? 'কুরআনের বিষয়ভিত্তিক তালিকা (সমগ্র কুরআন):' : 'Topic-Wise Lines Across Whole Quran:'}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                {themes.length} {currentLang === 'bn' ? 'টি বিষয়' : 'Topics'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => {
                const isSelected = selectedTheme === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setSelectedTheme(t.key);
                      setDisplayLimit(20);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    {currentLang === 'bn' ? getThemeBanglaName(t.key) : t.name}
                    <span className="ml-1.5 opacity-80 text-[10px] bg-black/10 px-1.5 py-0.5 rounded-md">
                      {t.verses.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Verses List Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <h2 className="text-base font-bold text-stone-900 font-serif-heading">
            {searchQuery
              ? currentLang === 'bn'
                ? `সমগ্র কুরআনে অনুসন্ধানের ফলাফল ("${searchQuery}")`
                : `Whole Quran Search Results for "${searchQuery}"`
              : currentLang === 'bn'
              ? `${getThemeBanglaName(selectedTheme)} বিষয়ক আয়াতসমূহ`
              : `${formatThemeName(selectedTheme)} — All Quranic Lines`}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            {totalCount} {currentLang === 'bn' ? 'টি আয়াত' : 'verses'}
          </span>
        </div>

        {/* Quick action: Reflect on this topic with AI */}
        {onSelectPrompt && (
          <button
            type="button"
            onClick={() => {
              const prompt =
                currentLang === 'bn'
                  ? `${getThemeBanglaName(selectedTheme)} সম্পর্কিত কুরআনের শিক্ষা ও নির্দেশনা নিয়ে গভীরভাবে চিন্তা করতে চাই।`
                  : `I want to reflect deeply on Quranic teachings regarding ${formatThemeName(selectedTheme)}.`;
              onSelectPrompt(prompt);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentLang === 'bn' ? 'এই বিষয়ে তাফাক্কুর করুন' : 'Reflect on this Topic'}</span>
          </button>
        )}
      </div>

      {/* Verses Container */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-stone-500">
            {currentLang === 'bn' ? 'সমগ্র কুরআন থেকে সংশ্লিষ্ট আয়াতসমূহ লোড হচ্ছে...' : 'Loading topic-wise verses from whole Quran...'}
          </p>
        </div>
      ) : verses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
          <p className="text-stone-700 font-medium">
            {currentLang === 'bn'
              ? 'কোনো সংশ্লিষ্ট আয়াত পাওয়া যায়নি।'
              : 'No matching verses found across the Quran.'}
          </p>
          <p className="text-xs text-stone-400">
            {currentLang === 'bn'
              ? 'অনুগ্রহ করে ভিন্ন কোনো শব্দ বা বিষয় নির্বাচন করুন।'
              : 'Try exploring another theme or simplifying your search terms.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {displayedVerses.map((verse) => (
              <VerseCard key={verse.ref} verse={verse} currentLang={currentLang} />
            ))}
          </div>

          {/* Show More / Show All lines buttons */}
          {hasMore && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 25)}
                className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 text-stone-700 hover:text-emerald-800 text-xs font-semibold transition-all shadow-xs"
              >
                {currentLang === 'bn'
                  ? `আরও ২৫টি আয়াত দেখুন (${displayedVerses.length} / ${verses.length})`
                  : `Show 25 More Verses (${displayedVerses.length} of ${verses.length})`}
              </button>
              <button
                type="button"
                onClick={() => setDisplayLimit(verses.length)}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold transition-all shadow-xs"
              >
                {currentLang === 'bn'
                  ? `সকল ${verses.length}টি আয়াত একসাথে দেখুন`
                  : `Show All ${verses.length} Lines from Quran`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
