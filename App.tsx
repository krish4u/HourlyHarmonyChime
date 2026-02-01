
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, PlayerState } from './types';
import { INITIAL_SETTINGS } from './constants';
import Clock from './components/Clock';
import Settings from './components/Settings';
import PlayerStatus from './components/PlayerStatus';
import { AudioManager } from './services/audioManager';
import { announceTime } from './services/geminiTTS';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE);
  const [currentAssetPath, setCurrentAssetPath] = useState<string | null>(null);
  const lastTriggeredHour = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    AudioManager.stopAll();
    setPlayerState(PlayerState.IDLE);
    setCurrentAssetPath(null);
  }, []);

  const formatNum = (n: number) => n.toString().padStart(3, '0');

  const triggerHourlySequence = useCallback(async (dateObj: Date) => {
    if (!settings.isEnabled) return;
    
    const hour = dateObj.getHours();
    const isWithinRange = settings.startHour <= settings.endHour 
      ? (hour >= settings.startHour && hour < settings.endHour)
      : (hour >= settings.startHour || hour < settings.endHour);

    if (!isWithinRange) return;

    // 1. Chimes (Bells)
    let bellCount = hour % 12 || 12;
    setPlayerState(PlayerState.CHIMING);
    await AudioManager.playBells(bellCount, settings.volume);

    // 2. Explicit Time Announcement
    setPlayerState(PlayerState.ANNOUNCING_TIME);
    const displayHour = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    await announceTime(`${displayHour} ${ampm}`, settings.volume);

    // 3. Prep data for file sequence
    const m = dateObj.getMonth();      // 0-11
    const d = dateObj.getDate();       // 1-31
    const dw = dateObj.getDay();       // 0-6 (Sun-Sat)
    const monthKey = MONTH_KEYS[m];

    // --- Sequence: Month -> Date -> Day -> Daily Song ---

    // Month Announcement File
    setPlayerState(PlayerState.ANNOUNCING_MONTH);
    const monthPath = `/audio/month/${formatNum(m + 1)}.mp3`;
    setCurrentAssetPath(monthPath);
    try {
      await AudioManager.playFile(monthPath, settings.volume);
    } catch {
      await announceTime(dateObj.toLocaleString('default', { month: 'long' }), settings.volume);
    }

    // Date Announcement File
    setPlayerState(PlayerState.ANNOUNCING_DATE);
    const datePath = `/audio/date/${formatNum(d)}.mp3`;
    setCurrentAssetPath(datePath);
    try {
      await AudioManager.playFile(datePath, settings.volume);
    } catch {
      await announceTime(`The ${d}`, settings.volume);
    }

    // Day Announcement File
    setPlayerState(PlayerState.ANNOUNCING_DAY);
    const dayPath = `/audio/day/${formatNum(dw + 1)}.mp3`;
    setCurrentAssetPath(dayPath);
    try {
      await AudioManager.playFile(dayPath, settings.volume);
    } catch {
      await announceTime(dateObj.toLocaleString('default', { weekday: 'long' }), settings.volume);
    }

    // Daily Song (from 3-letter month folder)
    setPlayerState(PlayerState.PLAYING_SONG);
    const songPath = `/audio/${monthKey}/${formatNum(d)}.mp3`;
    setCurrentAssetPath(songPath);
    try {
      await AudioManager.playFile(songPath, settings.volume);
    } catch {
      await announceTime(`Missing daily song track`, settings.volume);
    }

    setPlayerState(PlayerState.IDLE);
    setCurrentAssetPath(null);
  }, [settings]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getMinutes() === 0 && lastTriggeredHour.current !== now.getHours()) {
        lastTriggeredHour.current = now.getHours();
        triggerHourlySequence(now);
      }
    };
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [triggerHourlySequence]);

  const testSequence = () => triggerHourlySequence(new Date());

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      <header className="py-12 flex flex-col items-center">
        <h1 className="text-sm font-bold tracking-[0.4em] text-sky-500 uppercase mb-4">
          Atmospheric Chronometer
        </h1>
        <Clock />
        <PlayerStatus 
          state={playerState} 
          currentAsset={currentAssetPath} 
          onStop={stopPlayback}
        />
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        <Settings settings={settings} onUpdate={setSettings} />
        
        <div className="glass-morphism rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-sky-500/10 rounded-full">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Project Audio Library</h2>
          <p className="text-slate-400 text-sm max-w-md">
            The system plays files from your project's <code className="text-sky-300">/audio</code> folder. 
            <br/><span className="text-xs mt-2 block opacity-70">Sequence: Bell → Voice Announcement → Monthly/Daily Tracks</span>
          </p>
          <div className="pt-4">
            <button
              onClick={testSequence}
              disabled={playerState !== PlayerState.IDLE}
              className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-sky-900/20 disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span className="font-bold uppercase tracking-widest text-sm">Test Hourly Sequence</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-20 text-center text-slate-600 text-[10px] tracking-[0.3em] uppercase">
        Static Asset Engine • Gemini TTS Enabled
      </footer>
    </div>
  );
};

export default App;
