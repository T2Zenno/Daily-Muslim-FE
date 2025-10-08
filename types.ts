// FIX: Removed self-import of `Language` which was causing a conflict with its local declaration.
export type Language = 'id' | 'en';

export type HabitType = 'wajib' | 'sunnah';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';

export interface HabitNames {
  [key: string]: string;
}

export interface Schedule {
  time: string;
  dow: number[]; // day of week
  dom: number[]; // day of month (Gregorian)
  month: number | null; // Gregorian month
  mdom: number[]; // day of month for yearly (Gregorian)
  dates: string[];
  
  // Reminder fields
  reminderEnabled?: boolean;
  reminderDow?: number[];
  reminderDom?: number[];
  reminderMonth?: number | null;
  reminderMdom?: number[];

  // Hijri calendar fields
  useHijri?: boolean;
  hdom: number[]; // hijri day of month (for monthly)
  hmonth: number | null; // hijri month (for yearly)
  hmdom: number[]; // hijri day of month (for yearly)
}

export interface Streak {
  current: number;
  best: number;
  last: string;
}

export interface Habit {
  id: string;
  names: HabitNames;
  type: HabitType;
  freq: HabitFrequency;
  cat: string;
  schedule: Schedule;
  notes: string;
  active: boolean;
  streak: Streak;
  createdAt: number;
  targetStreak?: number;
}

export interface CompletionLog {
  [periodKey: string]: {
    done: boolean;
    ts: number;
  };
}

export interface Completions {
  [habitId: string]: CompletionLog;
}

export interface NotifiedLog {
    [notificationKey: string]: number;
}

export interface Module {
  id: string;
  icon: string;
  defaultTitleKey: string;
  customTitles: { [lang in Language]?: string };
  content: { [lang in Language]?: string };
}

export interface DBState {
  habits: Habit[];
  completions: Completions;
  notified: NotifiedLog;
  modules: Module[];
  version: number;
  // Fields for multi-user auth
  username: string;
  email: string;
  password?: string;
}

// New type for storing all user data, keyed by email
export type AllUsersData = {
    [email: string]: DBState;
};

export interface Translations {
    [key: string]: string;
}

export interface I18nData {
    id: Translations;
    en: Translations;
}

export interface Tab {
    id: HabitFrequency;
    icon: string;
    labelKey: string;
}

export interface DirectoryNode {
    children: { [key: string]: DirectoryNode };
    items: Habit[];
}

// Quran API Types (equran.id)
export interface EqAudio {
  [key: string]: string;
}

export interface EqSurahInfo {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: 'Mekah' | 'Madinah';
  arti: string;
  deskripsi: string;
  audioFull: EqAudio;
}

export interface EqAyat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: EqAudio;
}

export interface EqSuratNav {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

export interface EqSurahDetail extends EqSurahInfo {
  ayat: EqAyat[];
  suratSelanjutnya: EqSuratNav | false;
  suratSebelumnya: EqSuratNav | false;
}

// Dua API Types (equran.id/api/doa)
export interface EqDuaListItem {
  id: number;
  grup: string;
  nama: string;
  ar: string;
  tr: string;
  idn: string;
  tentang: string;
  tag: string[];
}

export interface EqDuaDetail extends EqDuaListItem {}

// Prayer Times API Types (myquran.com)
export interface PrayerCity {
  id: string;
  lokasi: string;
}

export interface PrayerTime {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export interface DailyPrayerData {
  status: boolean;
  data: {
    id: string;
    lokasi: string;
    daerah: string;
    jadwal: PrayerTime;
  }
}

export interface MonthlyPrayerData {
  status: boolean;
  data: {
    id: string;
    lokasi: string;
    daerah: string;
    jadwal: PrayerTime[];
  }
}

// Hadith API Types (api.hadith.gading.dev)
export interface HadithBook {
  name: string;
  id: string;
  available: number;
}

export interface Hadith {
  number: number;
  arab: string;
  id: string; // This is the Indonesian translation
}

export interface HadithListResponseData {
  name: string;
  id: string;
  available: number;
  requested?: number;
  hadiths: Hadith[];
}

export interface HadithDetail {
  name: string;
  id: string;
  available: number;
  contents: Hadith;
}

export interface HadithSearchData {
  name: string;
  id: string;
  available: number;
  query: string;
  hadiths: Hadith[];
  pagination: {
      currentPage: number;
      totalItems: number;
      totalPages: number;
      limit: number;
  }
}