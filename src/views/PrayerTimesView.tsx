import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';
import { isoDate, isoWeek, isDueThisPeriod, periodKey } from '../lib/utils';

export const PrayerTimesView: React.FC<{ t: (k: string) => string; lang: Language; }> = ({ t, lang }) => {
    const [view, setView] = useState<'city_list' | 'schedule'>('city_list');
    const [cities, setCities] = useState<PrayerCity[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState<PrayerCity | null>(null);
    const [scheduleView, setScheduleView] = useState<'daily' | 'monthly'>('daily');
    const [dailySchedule, setDailySchedule] = useState<DailyPrayerData['data'] | null>(null);
    const [monthlySchedule, setMonthlySchedule] = useState<MonthlyPrayerData['data'] | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = 'https://api.myquran.com/v2';

    useEffect(() => {
        const fetchCities = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/sholat/kota/semua`);
                if (!res.ok) throw new Error('Failed to fetch city list');
                const json = await res.json();
                if (!json.status) throw new Error(json.message || 'API error');
                setCities(json.data);
            } catch (e: any) {
                setError(t('errorFetching'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchCities();
    }, [t]);

    useEffect(() => {
        if (!selectedCity) return;
        const fetchSchedule = async () => {
            setIsLoading(true);
            setError(null);
            setDailySchedule(null);
            setMonthlySchedule(null);
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            try {
                const url = scheduleView === 'daily'
                    ? `${API_BASE}/sholat/jadwal/${selectedCity.id}/${year}/${month}/${day}`
                    : `${API_BASE}/sholat/jadwal/${selectedCity.id}/${year}/${month}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch schedule');
                const json = await res.json();
                if (!json.status) throw new Error(json.message || 'API error');
                if (scheduleView === 'daily') {
                    setDailySchedule(json.data);
                } else {
                    setMonthlySchedule(json.data);
                }
            } catch (e: any) {
                setError(t('errorFetching'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchedule();
    }, [selectedCity, selectedDate, scheduleView, t]);

    const filteredCities = useMemo(() => cities.filter(city => city.lokasi.toLowerCase().includes(searchTerm.toLowerCase())), [cities, searchTerm]);
    const handleCitySelect = (city: PrayerCity) => { setSelectedCity(city); setView('schedule'); };
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.value && setSelectedDate(new Date(e.target.value + 'T00:00:00'));
    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const [year, month] = e.target.value.split('-');
            setSelectedDate(new Date(Number(year), Number(month) - 1, 1));
        }
    };

    const PRAYER_TIME_DETAILS: { key: keyof Omit<PrayerTime, 'tanggal'>; icon: string }[] = [
        { key: 'imsak', icon: '⏳' }, { key: 'subuh', icon: '🌅' }, { key: 'terbit', icon: '☀️' },
        { key: 'dhuha', icon: '🌞' }, { key: 'dzuhur', icon: '🕛' }, { key: 'ashar', icon: '🌇' },
        { key: 'maghrib', icon: '🌆' }, { key: 'isya', icon: '🌙' },
    ];
    
    const renderContent = () => {
        if (isLoading) return <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>;
        if (error) return <div className="py-10 text-center text-red-500">{error}</div>;

        if (view === 'city_list') {
            return <>
                <div className="relative"><input type="text" placeholder={t('searchCityPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card" /><Icon className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-brand-muted">🔎</Icon></div>
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredCities.map(city => <button key={city.id} onClick={() => handleCitySelect(city)} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left font-semibold transition hover:border-sky-500 hover:bg-white dark:border-brand-line dark:bg-brand-card dark:hover:border-sky-400 dark:hover:bg-brand-panel">{city.lokasi}</button>)}
                </div>
            </>;
        }

        if (view === 'schedule') {
            const schedule = dailySchedule || monthlySchedule;
            return <>
                <div className="flex flex-wrap items-center gap-4">
                    <Button onClick={() => setView('city_list')}>&larr; {t('backToCityList')}</Button>
                    <div><h2 className="text-xl font-bold">{schedule?.lokasi}</h2><p className="text-sm text-slate-500 dark:text-brand-muted">{schedule?.daerah}</p></div>
                </div>
                <div className="my-3 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 dark:border-brand-line">
                    <div className="flex rounded-lg border border-slate-300 p-1 dark:border-brand-line">{['daily', 'monthly'].map(v => <button key={v} onClick={() => setScheduleView(v as 'daily' | 'monthly')} className={`rounded-md px-3 py-1 text-sm font-semibold transition ${scheduleView === v ? 'bg-sky-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-brand-card'}`}>{t(`${v}Schedule`)}</button>)}</div>
                    {scheduleView === 'daily' ? <input type="date" value={isoDate(selectedDate)} onChange={handleDateChange} className="rounded-md border border-slate-300 bg-slate-50 p-2 outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card" /> : <input type="month" value={isoDate(selectedDate).slice(0, 7)} onChange={handleMonthChange} className="rounded-md border border-slate-300 bg-slate-50 p-2 outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card" />}
                </div>
                {dailySchedule && scheduleView === 'daily' && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {PRAYER_TIME_DETAILS.map(p => <div key={p.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-brand-line dark:bg-brand-card"><div className="flex items-center gap-2 text-sm text-slate-500 dark:text-brand-muted"><Icon>{p.icon}</Icon>{t(p.key)}</div><p className="mt-1 text-2xl font-bold">{dailySchedule.jadwal[p.key as keyof PrayerTime]}</p></div>)}
                </div>}
                {monthlySchedule && scheduleView === 'monthly' && <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-brand-line"><table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-brand-card"><tr className="whitespace-nowrap">{[t('date'), ...PRAYER_TIME_DETAILS.map(p => t(p.key))].map(h => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
                    <tbody>{monthlySchedule.jadwal.map(day => <tr key={day.tanggal} className="border-t border-slate-200 dark:border-brand-line"><td className="p-3 font-semibold">{day.tanggal}</td>{PRAYER_TIME_DETAILS.map(p => <td key={p.key} className="p-3 font-mono">{day[p.key as keyof PrayerTime]}</td>)}</tr>)}</tbody>
                </table></div>}
            </>;
        }
        return null;
    }

    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex min-h-[60vh] flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                <strong className="flex items-center gap-2 text-lg">⏰ {t('prayerTimes')}</strong>
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                <div className="flex-grow">{renderContent()}</div>
                <div className="mt-4 border-t border-slate-200 pt-3 text-center text-xs text-slate-400 dark:border-brand-line dark:text-brand-muted">
                    {t('dataProvidedBy')} <a href="https://myquran.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">myQuran</a>
                </div>
            </div>
        </section>
    );
};
