import React from 'react';
import { AlertTriangle, PhoneCall, Heart, ExternalLink, LifeBuoy } from 'lucide-react';
import { DistressCheckResult } from '../types';

interface CrisisBannerProps {
  distress: DistressCheckResult;
  lang: 'en' | 'bn';
  onDismiss?: () => void;
}

export const CrisisBanner: React.FC<CrisisBannerProps> = ({ distress, lang, onDismiss }) => {
  if (distress.level === 'none') return null;

  const isCrisis = distress.level === 'crisis';

  return (
    <div
      id="crisis-support-banner"
      className={`rounded-2xl p-5 mb-6 border transition-all ${
        isCrisis
          ? 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-sm ring-1 ring-rose-300/40'
          : 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2.5 rounded-xl flex-shrink-0 ${
            isCrisis ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
          }`}
        >
          {isCrisis ? <LifeBuoy className="w-5 h-5 animate-pulse" /> : <Heart className="w-5 h-5" />}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <span>
                {lang === 'bn'
                  ? isCrisis
                    ? 'আপনি একা নন — আমরা আপনার পাশে আছি'
                    : 'মানসিক সমর্থন ও সহমর্মিতা'
                  : isCrisis
                  ? "You are not alone — please reach out for help"
                  : 'Gentle Support & Wellbeing Care'}
              </span>
            </h3>
            {onDismiss && !isCrisis && (
              <button
                onClick={onDismiss}
                className="text-xs text-stone-500 hover:text-stone-800 px-2 py-0.5 rounded-md hover:bg-stone-200/50"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
              </button>
            )}
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-line text-stone-700">
            {distress.support_response ||
              (lang === 'bn'
                ? 'আপনি যদি তীব্র মানসিক চাপে বা সংকটে থাকেন, অনুগ্রহ করে এখনই বিশ্বস্ত কারও বা সংকটকালীন হেল্পলাইনের সাহায্য নিন।'
                : 'If you or someone you know is going through a severe crisis or distress, please reach out to trusted local crisis services immediately.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="p-3 bg-white/80 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    {lang === 'bn' ? 'বাংলাদেশ (কান পেতে রই)' : 'Bangladesh: Kaan Pete Roi'}
                  </div>
                  <div className="text-xs text-stone-600 font-mono">09666-777777</div>
                </div>
              </div>
              <a
                href="tel:09666777777"
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                {lang === 'bn' ? 'কল' : 'Call'}
              </a>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    {lang === 'bn' ? 'আন্তর্জাতিক ক্রাইসিস ডিরেক্টরি' : 'International: Befrienders'}
                  </div>
                  <div className="text-xs text-stone-600">befrienders.org</div>
                </div>
              </div>
              <a
                href="https://www.befrienders.org"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-800 text-white hover:bg-stone-900 transition-colors inline-flex items-center gap-1"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
