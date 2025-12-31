
export interface DayContent {
  day: number;
  month: string;
  title: string;
  subtitle?: string;
  content: string[];
  mantra: string;
  mantraDescription: string;
  image: string;
}

export enum ViewMode {
  INTRO = 'INTRO',
  CALENDAR = 'CALENDAR',
  DAY_DETAIL = 'DAY_DETAIL',
  GALLERY = 'GALLERY'
}
