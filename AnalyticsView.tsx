import React, { useState, useMemo } from 'react';
import { Habit, DBState, Language, HabitFrequency } from './types';
import { isoDate, isoWeek, isDueThisPeriod } from './utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompletionHeatmap: React.FC<{
    startDate: Date;
    completions: Set<string>;
    dueDates: Set<string>;
    t: (k: string) => string;
    lang: Language;
}> = ({ startDate, completions, dueDates, t, lang }) => {
    const data = useMemo(() => {
        const days = [];
        const endDate = new Date();
        let currentDate = new Date(startDate);

        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dayOfWeek = firstDayOfMonth.getDay(); 
        const offset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Monday = 0

        for (let i = 0; i < offset; i++) {
            days.push({ key: `pad-start-${i}`, status: 'pad' });
        }
        
        while (currentDate <= endDate) {
            const dateKey = isoDate(currentDate);
            let status: 'completed' | 'missed' | 'neutral' = 'neutral';
            let title = currentDate.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });

            if (completions.has(dateKey)) {
                status = 'completed';
                title += ` (${t('completed')})`;
            } else if (dueDates.has(dateKey)) {
                status = 'missed';
                title += ` (${t('missed')})`;
            }

            days.push({
                key: dateKey,
                date: new Date(currentDate),
                status,
                title,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return days;
    }, [startDate, completions, dueDates, lang, t]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-brand-green';
            case 'missed': return 'bg-brand-red/70';
            case 'pad': return 'bg-transparent';
            default: return 'bg-slate-200 dark:bg-brand-card';
        }
    };

    const monthLabels = useMemo(() => {
        const months: { name: string; colStart: number }[] = [];
        let currentMonth = -1;
        let weekIndex = 0;
        const startDay = startDate.getDay();
        const offset = (startDay === 0) ? 6 : startDay - 1;

        for (let i = 0; i < data.length; i++) {
            if (data[i].status === 'pad') continue;
            
            const dayIndex = i - offset;
            if (dayIndex % 7 === 0) {
                 weekIndex++;
            }
            
            const date = data[i].date as Date;
            if (date.getMonth() !== currentMonth) {
                currentMonth = date.getMonth();
                months.push({ name: date.toLocaleString(lang, { month: 'short' }), colStart: weekIndex });
            }
        }
        return months;
    }, [data, startDate, lang]);
    
    return (
        <div className="overflow-x-auto p-1">
            <div className="relative flex gap-2">
                <div className="flex flex-col justify-between text-xs text-slate-400 dark:text-brand-muted">
                    <span>{lang === 'id' ? 'S' : 'M'}</span>
                    <span>{lang === 'id' ? 'R' : 'W'}</span>
                    <span>{lang === 'id' ? 'J' : 'F'}</span>
                </div>
                <div>
                    <div className="flex pl-1">
                        {monthLabels.map(m => <div key={m.name} className="absolute text-xs font-semibold" style={{left: `${(m.colStart - 1) * 1.25}rem`}}>{m.name}</div>)}
                    </div>
                    <div className="mt-5 grid grid-flow-col grid-rows-7 gap-1">
                        {data.map(day => (
                            <div key={day.key} title={day.title} className={`h-4 w-4 rounded-sm ${getStatusColor(day.status)}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


export const AnalyticsView: React.FC<{
    habits: Habit[];
    completions: DBState['completions'];
    t: (k: string) => string;
    lang: Language;
    theme: 'light' | 'dark';
}> = ({ habits, completions, t, lang, theme }) => {
    const [selectedHabitId, setSelectedHabitId] = useState<string>('overall');
    const [timePeriod, setTimePeriod] = useState<30 | 90 | 365>(30);

    const analyzableHabits = useMemo(() => habits.filter(h => h.active).sort((a,b) => (a.names[lang] || a.names.id).localeCompare(b.names[lang] || b.names.id)), [habits, lang]);
    const selectedHabit = useMemo(() => habits.find(h => h.id === selectedHabitId), [habits, selectedHabitId]);

    const analyticsData = useMemo(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (timePeriod - 1));

        if (selectedHabitId === 'overall') {
            const dailyHabits = habits.filter(h => h.freq === 'daily' && h.active);
            const data = [];
            for (let i = timePeriod -1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = isoDate(date);
                const dayLabel = date.toLocaleDateString(lang, { day: '2-digit', month: 'short' });
                const dueHabits = dailyHabits.filter(h => isDueThisPeriod(h, date));
                const completedCount = dueHabits.filter(h => completions[h.id]?.[dateKey]?.done).length;
                data.push({
                    name: dayLabel,
                    rate: dueHabits.length > 0 ? (completedCount / dueHabits.length) * 100 : 0,
                });
            }
            return { trendData: data };
        } 
        
        if (selectedHabit) {
            const habitCompletions = completions[selectedHabit.id] || {};
            const completionSet = new Set(Object.keys(habitCompletions));
            const dueDates = new Set<string>();
            const trendDataMap = new Map<string, { due: number; done: number }>();

            let currentDate = new Date(startDate);
            while(currentDate <= endDate) {
                if (isDueThisPeriod(selectedHabit, currentDate)) {
                    dueDates.add(isoDate(currentDate));
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            const getPrevKey = (key: string, freq: HabitFrequency): string | null => {
                 try {
                    if (freq === 'daily') {
                        const [y, m, d] = key.split('-').map(Number);
                        const dt = new Date(Date.UTC(y, m - 1, d));
                        dt.setUTCDate(dt.getUTCDate() - 1);
                        return dt.toISOString().split('T')[0];
                    }
                    if (freq === 'weekly') {
                        const [yearStr, weekStr] = key.split('-W');
                        let year = Number(yearStr);
                        let week = Number(weekStr);
                        if (week > 1) return `${year}-W${String(week - 1).padStart(2, '0')}`;
                        
                        const d = new Date(Date.UTC(year - 1, 11, 31));
                        const day = d.getUTCDay() || 7;
                        d.setUTCDate(d.getUTCDate() + 4 - day);
                        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
                    }
                    if (freq === 'monthly') {
                        const [y, m] = key.split('-').map(Number);
                        const dt = new Date(y, m - 1, 1);
                        dt.setMonth(dt.getMonth() - 1);
                        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                    }
                    if (freq === 'yearly') return String(Number(key) - 1);
                } catch { return null; }
                return null;
            }

            const getStreakHistory = () => {
                const sortedKeys = Object.keys(habitCompletions).filter(k => habitCompletions[k].done).sort();
                if (sortedKeys.length === 0) return [];

                const streakList: { endDate: string; length: number }[] = [];
                let currentLength = 1;

                for (let i = 1; i < sortedKeys.length; i++) {
                    const prevKeyInList = sortedKeys[i-1];
                    const currentKey = sortedKeys[i];
                    
                    const expectedPrevKey = getPrevKey(currentKey, selectedHabit.freq);
                    if (prevKeyInList === expectedPrevKey) {
                        currentLength++;
                    } else {
                        streakList.push({ endDate: prevKeyInList, length: currentLength });
                        currentLength = 1;
                    }
                }
                streakList.push({ endDate: sortedKeys[sortedKeys.length - 1], length: currentLength });
                return streakList.reverse();
            };
            
            return {
                completionSet,
                dueDates,
                streakHistory: getStreakHistory(),
                trendData: [] // Trend data calculation for non-daily habits is complex, will omit for now
            };
        }
        return null;
    }, [selectedHabitId, timePeriod, habits, completions, lang, selectedHabit]);

    const tickColor = theme === 'dark' ? '#94a3b8' : '#334155';
    const gridColor = theme === 'dark' ? '#1f2937' : '#e2e8f0';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (timePeriod - 1));

    return (
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                <strong className="flex items-center gap-2">📊 {t('progressDashboard')}</strong>
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="habit-select" className="text-sm font-semibold">{t('selectHabit')}</label>
                        <select id="habit-select" value={selectedHabitId} onChange={e => setSelectedHabitId(e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500">
                            <option value="overall">{t('overallProgress')}</option>
                            {analyzableHabits.map(h => <option key={h.id} value={h.id}>{h.names[lang] || h.names.id}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-semibold">{t('timePeriod')}</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                             {[30, 90, 365].map(p => (
                                <button key={p} onClick={() => setTimePeriod(p as 30 | 90 | 365)}
                                    className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${timePeriod === p ? 'border-transparent bg-brand-sky text-white' : 'border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card hover:border-slate-400 dark:hover:border-slate-700'}`}>
                                    {t(p === 30 ? 'last30Days' : p === 90 ? 'last90Days' : 'last365Days')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 <p className="mt-2 text-xs text-slate-500 dark:text-brand-muted">{t('analyticsInfo')}</p>
            </div>

            {!selectedHabit && selectedHabitId !== 'overall' && (
                <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                    <p className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('selectHabitFirst')}</p>
                </div>
            )}
            
            {selectedHabitId === 'overall' && analyticsData?.trendData && (
                <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                    <strong className="text-md">{t('overallProgress')}</strong>
                    <div className="mt-4 h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke={tickColor} fontSize={12} />
                                <YAxis stroke={tickColor} fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                                <Tooltip formatter={(value: number, name) => [`${value.toFixed(1)}%`, t('completionRateLast30Days')]} contentStyle={{backgroundColor: theme==='dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}`}}/>
                                <Bar dataKey="rate" fill="#38bdf8" name={t('completionRateLast30Days')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            
            {selectedHabit && analyticsData && (
                <>
                    <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                        <strong className="text-md">{t('completionHeatmap')}</strong>
                        <div className="mt-4">
                             <CompletionHeatmap startDate={startDate} completions={analyticsData.completionSet!} dueDates={analyticsData.dueDates!} t={t} lang={lang} />
                        </div>
                    </div>
                     <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                        <strong className="text-md">{t('streakHistory')}</strong>
                         <div className="mt-4 h-64 w-full">
                            {analyticsData.streakHistory && analyticsData.streakHistory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                     <BarChart data={analyticsData.streakHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                                        <XAxis dataKey="endDate" stroke={tickColor} fontSize={12} />
                                        <YAxis stroke={tickColor} fontSize={12} allowDecimals={false} />
                                        <Tooltip formatter={(value: number, name, props) => [`${value} ${selectedHabit.freq}s`, `${t('endedOn')}: ${props.payload.endDate}`]} contentStyle={{backgroundColor: theme==='dark' ? '#0f172a' : '#fff', border: `1px solid ${gridColor}`}}/>
                                        <Bar dataKey="length" fill="#f59e0b" name={t('streakLength')} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('noDataForChart')}</p>}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};