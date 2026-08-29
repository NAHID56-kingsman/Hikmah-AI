import React from 'react';
import {
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  BookOpen,
  HeartHandshake,
} from 'lucide-react';
import { QuranicChatbot } from './QuranicChatbot';

interface CounselorChatViewProps {
  currentLang: 'en' | 'bn';
  onNavigateToReflect?: () => void;
}

export const CounselorChatView: React.FC<CounselorChatViewProps> = ({
  currentLang,
  onNavigateToReflect,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-stone-950 text-white p-6 sm:p-8 lg:p-10 shadow-lg border border-emerald-800/40">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>
              {currentLang === 'bn' ? 'হিকমাহ চ্যাট ও কাউন্সেলিং স্পেস' : 'Hikmah AI Dialogue & Counselor Space'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight font-serif-heading text-white">
            {currentLang === 'bn'
              ? 'কথা বলুন, প্রশান্তি খুঁজুন ও বিশুদ্ধ দু’আ জানুন'
              : 'Talk Freely, Find Peace & Receive Authentic Du’as'}
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            {currentLang === 'bn'
              ? 'কোনো কিছু জিজ্ঞেস করার আগে আপনার মনের কথা খুলে বলুন। আমাদের এই নিরাপদ জায়গায় আপনি যেকোনো মানসিক জটিলতা, জীবনের সংশয় বা ইসলামিক বিষয়ে আলোচনা করতে পারেন। আমরা কুরআন ও সহীহ সুন্নাহর ভিত্তিতে বিশুদ্ধ মাসনূন দু’আ (হরকতসহ আরবি, উচ্চারণ, বাংলা ও ইংরেজি অর্থ এবং রেফারেন্সসহ) প্রদান করি।'
              : 'A dedicated private haven to talk before asking anything. Discuss personal struggles, emotional burdens, life decisions, or spiritual questions with an empathetic Islamic counselor grounded in the Quran and verified authentic Prophetic Du’as.'}
          </p>

          {/* Key Trust Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3 text-xs text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {currentLang === 'bn'
                  ? '১০০% বিশুদ্ধ মাসনূন দু’আ (সহীহ হাদিস রেফারেন্সসহ)'
                  : '100% Authentic Sunnah Du’as with Sahih citations'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3 text-xs text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {currentLang === 'bn'
                  ? 'English ও বাংলা — সব ভাষাতেই অনর্গল কথা বলুন'
                  : 'Speaks fluently in English & বাংলা'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-3 text-xs text-emerald-200">
              <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {currentLang === 'bn'
                  ? 'মানবিক সহমর্মিতা ও কুরআন-ভিত্তিক আত্মিক নিরাময়'
                  : 'Empathetic counseling & Quranic wisdom'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Chatbot Component */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              {currentLang === 'bn' ? 'লাইভ কাউন্সেলর চ্যাটরুম' : 'Live Counselor Chatroom'}
            </h3>
          </div>

          {onNavigateToReflect && (
            <button
              type="button"
              onClick={onNavigateToReflect}
              className="text-xs font-medium text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              <span>{currentLang === 'bn' ? 'পরিস্থিতি লিখে আয়াত খুঁজুন' : 'Search Verses by Situation'}</span>
            </button>
          )}
        </div>

        <QuranicChatbot
          currentLang={currentLang}
          userContext=""
          verses={[]}
          isStandalone={true}
        />
      </div>
    </div>
  );
};
