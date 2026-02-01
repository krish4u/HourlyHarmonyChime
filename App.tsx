
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

  const triggerHourlySequence = useCallback(async (dateObj: Date, isTest: boolean = false) => {
    // If not a manual test, check if the system is globally enabled
    if (!isTest && !settings.isEnabled) return;
    
    const hour = dateObj.getHours();
    console.log(`[Sequence] ${isTest ? 'Manual' : 'Hourly'} trigger for ${hour}:00`);

    // Only check range if it's NOT a manual test
    if (!isTest) {
    const isWithinRange = settings.startHour <= settings.endHour 
      ? (hour >= settings.startHour && hour < settings.endHour)
      : (hour >= settings.startHour || hour < settings.endHour);

    if (!isWithinRange) {
      console.log(`[Sequence] Skipping: Hour ${hour} outside of active window.`);
      return;
    }
    }

    // Unlocking AudioContext is mandatory for scheduled audio
    await AudioManager.resume();

    // 1. Chimes (Bells)
    let bellCount = hour % 12 || 12;
    console.log(`[Sequence] Step 1: Bells (${bellCount} strikes)`);
    setPlayerState(PlayerState.CHIMING);
    await AudioManager.playBells(bellCount, settings.volume);

    // 2. Explicit Time Announcement
    console.log(`[Sequence] Step 2: Time Announcement`);
    setPlayerState(PlayerState.ANNOUNCING_TIME);
    const displayHour = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    await announceTime(`${displayHour} ${ampm}`, settings.volume);

    // 3. File Sequence
    const m = dateObj.getMonth();
    const d = dateObj.getDate();
    const dw = dateObj.getDay();
    const monthKey = MONTH_KEYS[m];

    // Month
    console.log(`[Sequence] Step 3: Month`);
    setPlayerState(PlayerState.ANNOUNCING_MONTH);
    const monthPath = `/audio/month/${formatNum(m + 1)}.mp3`;
    setCurrentAssetPath(monthPath);
    try {
      await AudioManager.playFile(monthPath, settings.volume);
    } catch {
      console.warn(`[Sequence] ${monthPath} missing. Using TTS.`);
      await announceTime(dateObj.toLocaleString('default', { month: 'long' }), settings.volume);
    }

    // Date
    console.log(`[Sequence] Step 4: Date`);
    setPlayerState(PlayerState.ANNOUNCING_DATE);
    const datePath = `/audio/date/${formatNum(d)}.mp3`;
    setCurrentAssetPath(datePath);
    try {
      await AudioManager.playFile(datePath, settings.volume);
    } catch {
      console.warn(`[Sequence] ${datePath} missing. Using TTS.`);
      await announceTime(`The ${d}`, settings.volume);
    }

    // Day
    console.log(`[Sequence] Step 5: Day`);
    setPlayerState(PlayerState.ANNOUNCING_DAY);
    const dayPath = `/audio/day/${formatNum(dw + 1)}.mp3`;
    setCurrentAssetPath(dayPath);
    try {
      await AudioManager.playFile(dayPath, settings.volume);
    } catch {
      console.warn(`[Sequence] ${dayPath} missing. Using TTS.`);
      await announceTime(dateObj.toLocaleString('default', { weekday: 'long' }), settings.volume);
    }

    // Song
    console.log(`[Sequence] Step 6: Daily Song`);
    setPlayerState(PlayerState.PLAYING_SONG);
    const songPath = `/audio/${monthKey}/${formatNum(d)}.mp3`;
    setCurrentAssetPath(songPath);
    try {
      await AudioManager.playFile(songPath, settings.volume);
    } catch {
      console.warn(`[Sequence] ${songPath} missing.`);
    }

    stopPlayback();
  }, [settings, stopPlayback]);

  const testSequence = () => {
    console.log("[Manual Trigger] Starting test sequence (bypassing range and enabled state)...");
    triggerHourlySequence(new Date(), true);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        const currentHour = now.getHours();
        if (lastTriggeredHour.current !== currentHour) {
          lastTriggeredHour.current = currentHour;
          triggerHourlySequence(now, false);
      }
      } else if (now.getMinutes() !== 0) {
        lastTriggeredHour.current = null;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [triggerHourlySequence]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-500/30">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        <header className="w-full text-center space-y-4 mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Chrono Chime Audio System
          </div>
          <Clock />
        </header>

        <main className="w-full space-y-8">
          <PlayerStatus 
            state={playerState} 
            currentAsset={currentAssetPath} 
            onStop={stopPlayback}
          />
          
          <Settings settings={settings} onUpdate={setSettings} />

          {/* Test Hourly Sequence Button Section */}
          <div className="glass-morphism rounded-3xl p-8 flex flex-col items-center text-center space-y-6 w-full max-w-2xl mx-auto shadow-2xl border border-white/5">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-100 uppercase tracking-widest">Diagnostics</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Manually trigger the sequence. This ignores active hours and global settings for testing purposes.
              </p>
            </div>
            
            <button
              onClick={testSequence}
              disabled={playerState !== PlayerState.IDLE}
              className="group relative flex items-center space-x-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white px-10 py-4 rounded-2xl transition-all shadow-xl shadow-sky-900/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
            >
              <div className="absolute -inset-0.5 bg-sky-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <svg className="w-6 h-6 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span className="font-bold uppercase tracking-widest text-sm relative">Test Hourly Sequence</span>
            </button>
          </div>
        </main>

        <footer className="mt-20 text-slate-600 text-sm flex flex-col items-center space-y-2">
          <p>© 2024 Chrono Chime • Automated Hourly Scheduler</p>
          <div className="flex space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>System Online</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
