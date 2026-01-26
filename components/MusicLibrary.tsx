
import React, { useRef } from 'react';
import { Song } from '../types';

interface MusicLibraryProps {
  songs: Song[];
  onSongsChange: (songs: Song[]) => void;
}

const MusicLibrary: React.FC<MusicLibraryProps> = ({ songs, onSongsChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert FileList to Array and cast to File[] to fix 'unknown' type errors and allow access to .name
    const newSongs: Song[] = (Array.from(files) as File[]).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: '',
      file: file
    }));

    onSongsChange([...songs, ...newSongs]);
  };

  const removeSong = (id: string) => {
    onSongsChange(songs.filter(s => s.id !== id));
  };

  return (
    <div className="glass-morphism rounded-3xl p-6 md:p-8 w-full max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Music Library</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10"
        >
          Add Tracks
        </button>
        <input
          type="file"
          multiple
          accept="audio/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </div>

      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {songs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic">
            No tracks loaded. Please upload some music.
          </div>
        ) : (
          songs.map((song) => (
            <div key={song.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl group hover:bg-slate-800 transition-colors">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.803l8-1.6V14.114A4.369 4.369 0 0015 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
                  </svg>
                </div>
                <span className="text-slate-300 text-sm truncate">{song.name}</span>
              </div>
              <button
                onClick={() => removeSong(song.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MusicLibrary;
