
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, Song, PlayerState } from './types';
import { INITIAL_SETTINGS, DEMO_SONGS } from './constants';
import Clock from './components/Clock';
import Settings from './components/Settings';
import MusicLibrary from './components/MusicLibrary';
import PlayerStatus from './components/PlayerStatus';
import { AudioManager } from './services/audioManager';
import { announceTime } from './services/geminiTTS';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [songs, setSongs] = useState<Song[]>(DEMO_SONGS);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.IDLE);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const lastTriggeredHour = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    AudioManager.stopAll();
    setPlayerState(PlayerState.IDLE);
    setCurrentSong(null);
  }, []);

  const triggerHourlySequence = useCallback(async (hour: number) => {
    if (!settings.isEnabled) return;
    
    // Check if hour is in active range
    const isWithinRange = settings.startHour <= settings.endHour 
      ? (hour >= settings.startHour && hour < settings.endHour)
      : (hour >= settings.startHour || hour < settings.endHour); // Handles wrapping past midnight

    if (!isWithinRange) return;

    // 12-hour bell count logic
    let bellCount = hour % 12;
    if (bellCount === 0) bellCount = 12;

    const timeString = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;

    setPlayerState(PlayerState.CHIMING);
    await AudioManager.playBells(bellCount, settings.volume);

    setPlayerState(PlayerState.ANNOUNCING);
    await announceTime(timeString, settings.volume);

    if (songs.length > 0) {
      setPlayerState(PlayerState.PLAYING_SONG);
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      setCurrentSong(randomSong);
      await AudioManager.playSong(randomSong, settings.volume);
    }

    setPlayerState(PlayerState.IDLE);
    setCurrentSong(null);
  }, [settings, songs]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Trigger if it's the start of a new hour
      if (currentMinute === 0 && lastTriggeredHour.current !== currentHour) {
        lastTriggeredHour.current = currentHour;
        triggerHourlySequence(currentHour);
      }
    };

    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [triggerHourlySequence]);

  // Handle manual testing/forcing a sequence for demo purposes
  const testSequence = () => {
    const now = new Date();
    triggerHourlySequence(now.getHours());
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      {/* Top Header Section */}
      <header className="py-12 flex flex-col items-center">
        <h1 className="text-sm font-bold tracking-[0.4em] text-sky-500 uppercase mb-4">
          Atmospheric Chronometer
        </h1>
        <Clock />
        <PlayerStatus 
          state={playerState} 
          currentSong={currentSong} 
          onStop={stopPlayback}
        />
      </header>

      {/* Main Content Sections */}
      <main className="max-w-4xl mx-auto space-y-8">
        <Settings settings={settings} onUpdate={setSettings} />
        <MusicLibrary songs={songs} onSongsChange={setSongs} />

        <div className="flex justify-center pt-8">
          <button
            onClick={testSequence}
            disabled={playerState !== PlayerState.IDLE}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl transition-all border border-slate-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Trigger Sequence Now</span>
          </button>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 text-center text-slate-600 text-xs tracking-widest uppercase">
        Built with Google Gemini & Tailwind CSS
      </footer>
    </div>
  );
};

export default App;
