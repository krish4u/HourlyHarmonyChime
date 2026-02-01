
import React from 'react';
import { PlayerState } from '../types';

interface PlayerStatusProps {
  state: PlayerState;
  currentAsset: string | null;
  onStop: () => void;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ state, currentAsset, onStop }) => {
  const getStatusContent = () => {
    switch (state) {
      case PlayerState.CHIMING: 
        return <span className="text-sky-400 font-medium tracking-wide text-sm uppercase">Striking Chimes...</span>;
      case PlayerState.ANNOUNCING_TIME: 
        return <span className="text-emerald-400 font-medium tracking-wide text-sm uppercase">Announcing Time...</span>;
      case PlayerState.ANNOUNCING_MONTH: 
      case PlayerState.ANNOUNCING_DATE: 
      case PlayerState.ANNOUNCING_DAY: 
      case PlayerState.PLAYING_SONG: 
        return (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-sky-400 font-bold tracking-widest text-[10px] uppercase">
              Now Playing:
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-slate-200 font-mono text-sm bg-slate-800 px-3 py-1 rounded-lg border border-white/5">
                {currentAsset || 'Voice Announcement'}
              </span>
              <button
                onClick={onStop}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-1.5 rounded-lg transition-colors group flex items-center justify-center"
                title="Stop playback"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="5" y="5" width="10" height="10" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        );
      default: 
        return <span className="text-slate-500 font-medium tracking-wide text-xs uppercase opacity-60">System Ready • Awaiting next hour</span>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-4 h-24">
      <div className="flex items-center space-x-2">
        {state !== PlayerState.IDLE && (
          <div className="flex space-x-1 mr-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-1 h-5 bg-sky-400 rounded-full animate-bounce`} 
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
        {getStatusContent()}
      </div>
    </div>
  );
};

export default PlayerStatus;
