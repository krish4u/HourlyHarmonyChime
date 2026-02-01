
export class AudioManager {
  private static musicAudio: HTMLAudioElement | null = null;
  private static audioCtx: AudioContext | null = null;
  private static currentResolve: (() => void) | null = null;

  private static getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  /**
   * Plays the hourly bells. 
   * Tries to find /audio/bell.mp3 first, then falls back to synthetic sound.
   */
  static async playBells(count: number, volume: number): Promise<void> {
    const ctx = this.getAudioContext();
    const bellUrl = '/audio/bell.mp3';
    
    // Check if bell.mp3 exists via HEAD request to avoid downloading it just to check
    let useFile = false;
    try {
      const resp = await fetch(bellUrl, { method: 'HEAD' });
      if (resp.ok) useFile = true;
    } catch (e) {
      useFile = false;
    }

    for (let i = 0; i < count; i++) {
      if (useFile) {
        // Use a lightweight play method for bells to allow overlap (natural reverb)
        await this.playBellStrike(bellUrl, volume);
      } else {
      await this.playSyntheticBell(ctx, volume);
      }
      // Spacing between strikes (1.2 seconds for better natural feel)
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  /**
   * Internal helper to play a bell strike without stopping global musicAudio.
   * This allows bell strikes to overlap their "tails" naturally.
   */
  private static playBellStrike(url: string, volume: number): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.onended = () => resolve();
      audio.onerror = () => resolve(); // Fallback: resolve anyway to prevent hanging the sequence
      audio.play().catch(() => resolve());
    });
  }

  private static playSyntheticBell(ctx: AudioContext, volume: number): Promise<void> {
    return new Promise((resolve) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 1.5);
      oscillator.onended = () => resolve();
    });
  }

  /**
   * Main playback method for month/day/song tracks.
   * Stops any currently playing background music before starting a new one.
   */
  static async playFile(url: string, volume: number): Promise<void> {
    this.stopAll();
    
    this.musicAudio = new Audio(url);
    this.musicAudio.volume = volume;
    
    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      
      const onEnded = () => {
        cleanup();
        resolve();
      };

      const onError = (e: any) => {
        cleanup();
        reject(new Error(`Failed to load: ${url}`));
      };

      const cleanup = () => {
        this.musicAudio?.removeEventListener('ended', onEnded);
        this.musicAudio?.removeEventListener('error', onError);
        this.currentResolve = null;
      };

      this.musicAudio?.addEventListener('ended', onEnded);
      this.musicAudio?.addEventListener('error', onError);
      
      this.musicAudio?.play().catch(e => {
        cleanup();
        reject(e);
      });
    });
  }

  static stopAll() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
    if (this.currentResolve) {
      this.currentResolve();
      this.currentResolve = null;
    }
  }
}
