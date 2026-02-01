
export interface AppSettings {
  startHour: number; 
  endHour: number;   
  volume: number;    
  isEnabled: boolean;
}

export enum PlayerState {
  IDLE = 'IDLE',
  CHIMING = 'CHIMING',
  ANNOUNCING_TIME = 'ANNOUNCING_TIME',
  ANNOUNCING_MONTH = 'ANNOUNCING_MONTH',
  ANNOUNCING_DATE = 'ANNOUNCING_DATE',
  ANNOUNCING_DAY = 'ANNOUNCING_DAY',
  PLAYING_SONG = 'PLAYING_SONG'
}

export interface Song {
  id: string;
  name: string;
  url: string;
}
