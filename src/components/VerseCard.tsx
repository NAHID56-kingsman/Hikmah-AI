import React, { useState, useRef } from 'react';
import { Play, Pause, Copy, Check, Volume2, Bookmark, Share2 } from 'lucide-react';
import { Verse } from '../types';
import { getAyahAudioUrl, formatThemeName, getThemeBanglaName } from '../utils';

interface VerseCardProps {
  verse: Verse;
  currentLang: 'en' | 'bn' | 'banglish';
  highlightThemes?: boolean;
}

export const VerseCard: React.FC<VerseCardProps> = ({
  verse,
  currentLang,
  highlightThemes = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = getAyahAudioUrl(verse.surah_no, verse.ayah_no);

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        console.warn('Audio recitation currently unavailable');
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error', e);
        setIsPlaying(false);
      });
    }
  };

  const handleCopy = () => {
    const text = `[Surah ${verse.surah_name_translit} (${verse.ref})]\n\n${verse.arabic}\n\nEnglish: ${verse.english}\nBangla: ${verse.bangla}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`verse-card-${verse.ref.replace(':', '-')}`}
      className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-stone-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200/60 font-mono">
            {verse.ref}
          </span>
          <span className="text-sm font-semibold text-stone-900 font-serif-heading">
            {verse.surah_name_translit}
          </span>
          <span className="text-xs text-stone-600 hidden sm:inline">
            ({currentLang === 'bn' && verse.surah_name_bn ? verse.surah_name_bn : verse.surah_name_en})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio Recitation Button */}
          <button
            id={`play-audio-${verse.ref.replace(':', '-')}`}
            onClick={toggleAudio}
            title={isPlaying ? 'Pause Recitation' : 'Listen to Recitation (Mishary Alafasy)'}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPlaying ? 'Playing' : 'Audio'}</span>
          </button>

          {/* Copy Button */}
          <button
            id={`copy-verse-${verse.ref.replace(':', '-')}`}
            onClick={handleCopy}
            title="Copy Verse Citation"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Arabic Script */}
      <div className="my-4 text-right">
        <p
          className="font-arabic text-2xl sm:text-3xl leading-loose sm:leading-[2.6rem] text-stone-900 font-normal selection:bg-emerald-100"
          dir="rtl"
        >
          {verse.arabic}
        </p>
      </div>

      {/* Translations */}
      <div className="space-y-3 pt-2">
        {/* Bangla Translation */}
        <div className={`p-3 rounded-xl ${currentLang === 'bn' ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-stone-50/60'}`}>
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            বাংলা অনুবাদ
          </div>
          <p className="font-bangla text-stone-800 text-sm sm:text-base leading-relaxed">
            {verse.bangla}
          </p>
        </div>

        {/* English Translation */}
        <div className={`p-3 rounded-xl ${currentLang === 'en' ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-stone-50/60'}`}>
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            English Translation (Sahih International)
          </div>
          <p className="text-stone-800 text-sm sm:text-base leading-relaxed italic">
            "{verse.english}"
          </p>
        </div>
      </div>

      {/* Themes Tags */}
      {highlightThemes && verse.themes && verse.themes.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-4 mt-4 border-t border-stone-100">
          <span className="text-[11px] text-stone-600 font-medium mr-1">
            {currentLang === 'bn' ? 'সম্পর্কিত বিষয়:' : 'Themes:'}
          </span>
          {verse.themes.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              {currentLang === 'bn' ? getThemeBanglaName(t) : formatThemeName(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
