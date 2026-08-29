import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CrisisBanner } from './components/CrisisBanner';
import { ReflectionInput } from './components/ReflectionInput';
import { ReflectionCard } from './components/ReflectionCard';
import { ThemesBrowser } from './components/ThemesBrowser';
import { CounselorChatView } from './components/CounselorChatView';
import { DistressCheckResult, ReflectionResponse } from './types';
import { Sparkles, BookOpen, Heart, Shield } from 'lucide-react';

export function App() {
  const [currentLang, setCurrentLang] = useState<'en' | 'bn'>('en');
  const [activeTab, setActiveTab] = useState<'reflect' | 'chat' | 'browse'>('reflect');
  const [availableThemes, setAvailableThemes] = useState<{ key: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState<string>('');
  const [reflectionResult, setReflectionResult] = useState<ReflectionResponse | null>(null);
  const [distressAlert, setDistressAlert] = useState<DistressCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch available themes on load
  useEffect(() => {
    fetch('/api/themes')
      .then((res) => res.json())
      .then((data) => {
        setAvailableThemes(
          data.map((d: any) => ({
            key: d.key,
            name: d.name,
          }))
        );
      })
      .catch((err) => console.error('Error fetching themes:', err));
  }, []);

  const handleReflectSubmit = async (
    message: string,
    selectedThemes: string[],
    responseLang: 'auto' | 'en' | 'bn' = 'auto'
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setDistressAlert(null);

    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          preferredLanguage: responseLang === 'auto' ? currentLang : responseLang,
          selectedThemes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate reflection');
      }

      setReflectionResult(data);

      if (data.distress && data.distress.level !== 'none') {
        setDistressAlert(data.distress);
      }

      // Auto scroll to reflection response
      setTimeout(() => {
        const el = document.getElementById('reflection-response-container');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      {/* Header */}
      <Header
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Distress Alert Banner if active */}
        {distressAlert && (
          <CrisisBanner
            distress={distressAlert}
            lang={currentLang}
            onDismiss={() => setDistressAlert(null)}
          />
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-600 hover:text-rose-900 font-semibold ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'reflect' ? (
          <div>
            {/* Hero / Intro Banner */}
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-heading">
                {currentLang === 'bn'
                  ? 'কুরআনের সান্নিধ্যে মানসিক প্রশান্তি'
                  : 'Find Solace & Guidance Through the Quran'}
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                {currentLang === 'bn'
                  ? 'আপনার অনুভূতি, সংকট বা চিন্তা শেয়ার করুন। হিকমাহ এআই প্রাসঙ্গিক আয়াত ও ভাবনা উপস্থাপন করবে।'
                  : 'Share what you are navigating. Hikmah AI retrieves fitting verses in Arabic, English, & Bangla with gentle reflections.'}
              </p>
            </div>

            {/* Input Component */}
            <ReflectionInput
              currentLang={currentLang}
              isLoading={isLoading}
              onSubmit={handleReflectSubmit}
              availableThemes={availableThemes}
              initialText={inputText}
            />

            {/* Reflection Result */}
            {reflectionResult && (
              <ReflectionCard data={reflectionResult} currentLang={currentLang} />
            )}
          </div>
        ) : activeTab === 'chat' ? (
          <CounselorChatView
            currentLang={currentLang}
            onNavigateToReflect={() => {
              setActiveTab('reflect');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <ThemesBrowser
            currentLang={currentLang}
            onSelectPrompt={(p) => {
              setInputText(p);
              setActiveTab('reflect');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-stone-100/50 py-6 text-center text-xs text-stone-500 space-y-2">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span>Hikmah AI — Islamic Reflection & Authentic Du'a Companion</span>
          <span>•</span>
          <span>Multilingual: English • বাংলা</span>
          <span>•</span>
          <span>Authentic Sunnah Du'as & Quranic Retrieval</span>
        </div>
        <p className="text-[11px] text-stone-400 max-w-xl mx-auto px-4">
          Verses and Authentic Du'as sourced from the Holy Quran and Sahih Hadith (Bukhari, Muslim, Abu Dawud, Tirmidhi). Always verify personal religious rulings with qualified Islamic scholars.
        </p>
      </footer>
    </div>
  );
}

export default App;
