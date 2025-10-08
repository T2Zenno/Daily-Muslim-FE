import { type Habit, type HabitNames, type HabitType, type HabitFrequency, type DBState, type Module, type AllUsersData } from './types';
import { I18N, DAY_OF_WEEK_OPTIONS } from './constants';

export const pad = (n: number) => String(n).padStart(2, '0');

export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function isoWeek(d: Date): string {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${dt.getUTCFullYear()}-W${pad(weekNo)}`;
}

export const periodKey = (h: Habit, date: Date = new Date()): string => {
    switch (h.freq) {
        case 'daily': return isoDate(date);
        case 'weekly': return isoWeek(date);
        case 'monthly': return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
        case 'yearly': return String(date.getFullYear());
        case 'special': return isoDate(date);
        default: return isoDate(date);
    }
};

export const uid = (): string => 'h_' + Math.random().toString(36).slice(2, 10);

/**
 * Converts a Gregorian date to an approximate Hijri date.
 * Uses a simplified version of Kuwamoto's algorithm. Accuracy is generally within a day.
 * @param date The Gregorian date object.
 * @returns An object with Hijri year (hy), month (hm), and day (hd).
 */
export function gregorianToHijri(date: Date): { hy: number; hm: number; hd: number } {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    const jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
             Math.floor((367 * (m - 2 - 12 * (Math.floor((m - 14) / 12)))) / 12) -
             Math.floor((3 * (Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100))) / 4) +
             d - 32075;

    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const i = l - 10631 * n + 354;
    const j = (Math.floor((10985 - i) / 5316)) * (Math.floor((50 * i) / 17719)) +
              (Math.floor(i / 5670)) * (Math.floor((43 * i) / 15238));
    const k = i - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) -
              (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;

    const hm = Math.floor((24 * k) / 709);
    const hd = k - Math.floor((709 * hm) / 24);
    const hy = 30 * n + j - 30;

    return { hy, hm, hd };
}

export const isDueThisPeriod = (h: Habit, date: Date = new Date()): boolean => {
    const hijri = (h.schedule.useHijri || h.freq === 'monthly' || h.freq === 'yearly') ? gregorianToHijri(date) : null;
    switch (h.freq) {
        case 'daily': return true;
        case 'weekly': return !h.schedule.dow?.length || h.schedule.dow.includes(date.getDay());
        case 'monthly': 
            if (h.schedule.useHijri) {
                return !h.schedule.hdom?.length || h.schedule.hdom.includes(hijri!.hd);
            }
            return !h.schedule.dom?.length || h.schedule.dom.includes(date.getDate());
        case 'yearly': 
             if (h.schedule.useHijri) {
                return (!h.schedule.hmonth && !h.schedule.hmdom?.length) || 
                       (hijri!.hm === h.schedule.hmonth && (!h.schedule.hmdom?.length || h.schedule.hmdom.includes(hijri!.hd)));
            }
            return (!h.schedule.month && !h.schedule.mdom?.length) || 
                   ((date.getMonth() + 1) === h.schedule.month && (!h.schedule.mdom?.length || h.schedule.mdom.includes(date.getDate())));
        case 'special': return !h.schedule.dates?.length || h.schedule.dates.includes(isoDate(date));
        default: return false;
    }
};

export const isReminderScheduledForToday = (h: Habit, date: Date): boolean => {
    const s = h.schedule;
    // For special dates, the reminder is implicitly on the scheduled date itself.
    if (h.freq === 'special') return true; 

    // If no specific reminder days/dates are set, assume it's for every due day.
    const noSpecificReminder = !s.reminderDow?.length && !s.reminderDom?.length && !s.reminderMdom?.length;
    if (noSpecificReminder) return true;

    const day = date.getDate();
    const dow = date.getDay();
    const month = date.getMonth() + 1;
    
    switch(h.freq) {
        case 'daily':
        case 'weekly':
            return s.reminderDow?.includes(dow) ?? false;
        case 'monthly':
            return s.reminderDom?.includes(day) ?? false;
        case 'yearly':
            return (s.reminderMonth === month && (s.reminderMdom?.includes(day) ?? false)) ?? false;
        default:
            return false;
    }
};

const sample = (names: HabitNames, type: HabitType, freq: HabitFrequency, cat: string, opts: any = {}): Habit => ({
    id: uid(),
    names,
    type,
    freq,
    cat,
    schedule: { 
        time: opts.time || '', 
        dow: opts.dow || [], 
        dom: opts.dom || [], 
        month: opts.month || null, 
        mdom: opts.mdom || [], 
        dates: opts.dates || [],
        reminderEnabled: !!opts.time,
        reminderDow: opts.dow || [],
        reminderDom: opts.reminderDom || [],
        reminderMonth: opts.reminderMonth || null,
        reminderMdom: opts.reminderMdom || [],
        useHijri: opts.useHijri || false,
        hdom: opts.hdom || [],
        hmonth: opts.hmonth || null,
        hmdom: opts.hmdom || [],
    },
    notes: opts.notes || '',
    active: true,
    streak: { current: 0, best: 0, last: '' },
    createdAt: Date.now()
});

export function seed(): Omit<DBState, 'password' | 'username' | 'email'> {
    const S: Habit[] = [];
    S.push(sample({id:'Shalat Subuh',en:'Fajr Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'05:00'}));
    S.push(sample({id:'Shalat Zuhur',en:'Dhuhr Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'12:00'}));
    S.push(sample({id:'Shalat Ashar',en:'Asr Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'15:30'}));
    S.push(sample({id:'Shalat Maghrib',en:'Maghrib Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'18:00'}));
    S.push(sample({id:'Shalat Isya',en:'Isha Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'19:00'}));
    S.push(sample({id:'Shalat Dhuha',en:'Duha Prayer'},'sunnah','daily','Ibadah Ritual/Shalat Sunnah',{time:'09:00'}));
    S.push(sample({id:'Dzikir Pagi',en:'Morning Adhkar'},'sunnah','daily','Ibadah Ritual/Dzikir',{time:'05:30'}));
    S.push(sample({id:'Dzikir Petang',en:'Evening Adhkar'},'sunnah','daily','Ibadah Ritual/Dzikir',{time:'17:30'}));
    S.push(sample({id:'Tilawah Al-Qur’an',en:'Qur’an Recitation'},'sunnah','daily','Ibadah Ritual/Al-Qur’an',{time:'20:30'}));
    S.push(sample({id:'Puasa Senin',en:'Monday Fast'},'sunnah','weekly','Ibadah Ritual/Puasa',{dow:[1],time:'05:00'}));
    S.push(sample({id:'Puasa Kamis',en:'Thursday Fast'},'sunnah','weekly','Ibadah Ritual/Puasa',{dow:[4],time:'05:00'}));
    
    // Hijri-based monthly habit
    S.push(sample({id:'Puasa Ayyamul Bidh',en:'Ayyamul Bidh Fasting'},'sunnah','monthly','Ibadah Ritual/Puasa',{useHijri:true, hdom:[13,14,15]}));

    S.push(sample({id:'Berbakti kepada Orang Tua',en:'Honor Parents'},'wajib','weekly','Orang Tua',{dow:[0],notes:'Telepon/kunjungan/ bantuan nyata'}));
    S.push(sample({id:'Waktu Berkualitas Keluarga',en:'Family Quality Time'},'sunnah','weekly','Keluarga',{dow:[6]}));
    S.push(sample({id:'Sedekah Harian',en:'Daily Charity'},'sunnah','daily','Sosial/Sedekah'));
    S.push(sample({id:'Wudhu sebelum tidur',en:'Ablution before sleep'},'sunnah','daily','Adab/Tidur'));
    
    // Hijri-based yearly Habits
    S.push(sample({id:'Zakat Fitrah',en:'Zakat al-Fitr'},'wajib','yearly','Ibadah Ritual/Zakat',{useHijri:true, hmonth:9, hmdom:[29], notes:'Dibayarkan sebelum Shalat Idul Fitri, biasanya pada hari terakhir Ramadhan. / Paid before Eid al-Fitr prayer, typically on the last day of Ramadan.'}));
    S.push(sample({id:'Qurban',en:'Qurban Sacrifice'},'sunnah','yearly','Ibadah Ritual/Qurban',{useHijri:true, hmonth:12, hmdom:[10,11,12,13], notes:'Dilaksanakan pada hari Idul Adha dan hari Tasyrik. / Performed on Eid al-Adha and the following three days (Tashreeq).'}));
    S.push(sample({id:'Puasa Arafah',en:"Arafah Fast"},'sunnah','yearly','Ibadah Ritual/Puasa',{useHijri:true, hmonth:12, hmdom:[9], notes:"Puasa tanggal 9 Dzulhijjah. / Fast on the 9th of Dhu al-Hijjah."}));
    S.push(sample({id:"Puasa Tasu'a & 'Asyura",en:"Tasu'a & 'Ashura Fast"},'sunnah','yearly','Ibadah Ritual/Puasa',{useHijri:true, hmonth:1, hmdom:[9, 10], notes:"Puasa tanggal 9 & 10 Muharram. / Fast on the 9th & 10th of Muharram."}));

    const M: Module[] = [
        { id: 'quran', icon: '📖', defaultTitleKey: 'quran', customTitles: {}, content: {} },
        { id: 'hadith', icon: '📜', defaultTitleKey: 'hadith', customTitles: {}, content: {} },
        { id: 'zakat', icon: '💸', defaultTitleKey: 'zakat', customTitles: {}, content: {} },
        { id: 'inheritance', icon: '⚖️', defaultTitleKey: 'inheritanceCalculator', customTitles: {}, content: {} },
        { id: 'prayer_times', icon: '⏰', defaultTitleKey: 'prayerTimes', customTitles: {}, content: {} },
        { id: 'qibla', icon: '🕋', defaultTitleKey: 'qibla', customTitles: {}, content: {} },
        { id: 'duas', icon: '🤲', defaultTitleKey: 'duas', customTitles: {}, content: {} },
    ];

    return { habits: S, completions: {}, notified: {}, modules: M, version: 7 };
}

export function getInitialUsers(): AllUsersData {
    const fathimahData: DBState = {
        ...seed(),
        username: 'Fathimah',
        email: 'fathimah@example.com',
        password: '123',
    };
    
    const umarHabits: Habit[] = [
        sample({id:'Shalat Subuh',en:'Fajr Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'05:10'}),
        sample({id:'Shalat Isya',en:'Isha Prayer'},'wajib','daily','Ibadah Ritual/Shalat Wajib',{time:'19:15'}),
        sample({id:'Baca buku Islam',en:'Read Islamic Book'},'sunnah','weekly','Tsaqafah Islamiyah',{dow:[2,4]}),
    ];
    const umarCompletions = {
        [umarHabits[0].id]: {
            [isoDate(new Date(Date.now() - 86400000))]: { done: true, ts: Date.now() - 86400000 }
        }
    };
    
    const umarData: DBState = {
        habits: umarHabits,
        completions: umarCompletions,
        notified: {},
        modules: seed().modules.map(m => ({ ...m, customTitles: {}, content: {} })), // Fresh modules
        version: 7,
        username: 'Umar',
        email: 'umar@example.com',
        password: '456',
    };

    return {
        'fathimah@example.com': fathimahData,
        'umar@example.com': umarData,
    };
}