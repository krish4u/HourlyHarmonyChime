
export class AudioManager {
  private static musicAudio: HTMLAudioElement | null = null;
  private static audioCtx: AudioContext | null = null;
  private static currentResolve: (() => void) | null = null;

  static async resume() {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log("AudioContext resumed successfully.");
      } catch (e) {
        console.error("Failed to resume AudioContext:", e);
      }
    }
  }

  private static getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  /**
   * Plays the hourly bells. 
   * Tries to play /audio/bell.mp3 first. If it fails, falls back to synthetic sound.
   */
  static async playBells(count: number, volume: number): Promise<void> {
    await this.resume();
    const ctx = this.getAudioContext();
    const bellUrl = '/audio/bell.mp3';
    
    let useFile = false;
    try {
      // Check if file is available by trying to load it in a silent way
      useFile = await new Promise((resolve) => {
        const audio = new Audio(bellUrl);
        audio.oncanplaythrough = () => resolve(true);
        audio.onerror = () => resolve(false);
        // Timeout check for file existence
        setTimeout(() => resolve(false), 2000);
      });
    } catch (e) {
      console.error("Error checking bell file:", e);
      useFile = false;
    }

    console.log(`Bells: Using ${useFile ? 'external file (/audio/bell.mp3)' : 'synthetic fallback'}`);

    for (let i = 0; i < count; i++) {
      if (useFile) {
        await this.playBellStrike(bellUrl, volume);
      } else {
      await this.playSyntheticBell(ctx, volume);
      }
      // Wait for the strike to finish + gap
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  private static playBellStrike(url: string, volume: number): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.onended = () => resolve();
      audio.onerror = (e) => {
        console.error(`Bell strike error for ${url}:`, e);
        resolve();
      };
      audio.play().catch((e) => {
        console.error(`Bell play interrupted:`, e);
        resolve();
      });
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
    console.log(`[AudioManager] Attempting to play: ${url}`);
    
    this.musicAudio = new Audio(url);
    this.musicAudio.volume = volume;
    
    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      
      const onEnded = () => {
        console.log(`[AudioManager] Finished playing: ${url}`);
        cleanup();
        resolve();
      };

      const onError = (e: any) => {
        console.error(`[AudioManager] FAILED to load: ${url}. (Browser might be blocking or file missing). Error:`, e);
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
        console.error(`[AudioManager] Play error for ${url}:`, e);
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
