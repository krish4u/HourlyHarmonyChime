
export interface Song {
  id: string;
  name: string;
  url: string;
  file?: File;
}

export interface AppSettings {
  startHour: number; // 0-23
  endHour: number;   // 0-23
  volume: number;    // 0-1
  isEnabled: boolean;
}

export enum PlayerState {
  IDLE = 'IDLE',
  CHIMING = 'CHIMING',
  ANNOUNCING = 'ANNOUNCING',
  PLAYING_SONG = 'PLAYING_SONG'
}
