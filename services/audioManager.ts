
import { Song } from '../types';

export class AudioManager {
  private static musicAudio: HTMLAudioElement | null = null;
  private static audioCtx: AudioContext | null = null;
  private static songResolve: (() => void) | null = null;

  private static getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  static async playBells(count: number, volume: number): Promise<void> {
    const ctx = this.getAudioContext();
    
    for (let i = 0; i < count; i++) {
      await this.playSyntheticBell(ctx, volume);
      // Gap between chimes
      await new Promise(r => setTimeout(r, 800));
    }
  }

  private static playSyntheticBell(ctx: AudioContext, volume: number): Promise<void> {
    return new Promise((resolve) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      // High frequency for a 'ding' sound
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 1.5);

      oscillator.onended = () => {
        resolve();
      };
    });
  }

  static async playSong(song: Song, volume: number): Promise<void> {
    this.stopAll();
    
    const url = song.file ? URL.createObjectURL(song.file) : song.url;
    this.musicAudio = new Audio(url);
    this.musicAudio.volume = volume;
    
    return new Promise((resolve) => {
      this.songResolve = resolve;
      if (!this.musicAudio) {
        this.songResolve = null;
        return resolve();
      }

      const cleanup = () => {
        if (song.file) URL.revokeObjectURL(url);
        this.musicAudio?.removeEventListener('ended', onEnded);
        this.songResolve = null;
      };

      const onEnded = () => {
        cleanup();
        resolve();
      };

      this.musicAudio.addEventListener('ended', onEnded);
      this.musicAudio.play().catch(e => {
        console.error("Song playback failed:", e);
        cleanup();
        resolve();
      });
    });
  }

  static stopAll() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
    if (this.songResolve) {
      this.songResolve();
      this.songResolve = null;
    }
  }
}
