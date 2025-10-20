import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';
import { isoDate, isoWeek, isDueThisPeriod, periodKey } from '../lib/utils';

export const HistoryModal: React.FC<{
    isOpen: boolean; onClose: () => void; habit?: Habit; completions?: DBState['completions'][string]; t: (k: string) => string; lang: Language;
}> = ({ isOpen, onClose, habit, completions, t, lang }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            setViewDate(new Date());
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    if (!habit) return null;

    const name = habit.names[lang] || habit.names.id;
    const completionLog = completions || {};
    const completionKeys = Object.keys(completionLog);

    const renderList = () => (
        <ul className="max-h-96 space-y-2 overflow-y-auto pr-2">
            {completionKeys.sort().reverse().map(key => (
                <li key={key} className="flex flex-wrap justify-between gap-2 rounded-md border border-slate-200 dark:border-brand-line bg-slate-100 dark:bg-brand-card p-2 text-sm">
                    <span className="font-mono font-bold">{key}</span>
                    <span className="text-slate-500 dark:text-brand-muted">
                        {t('completedOn')} {new Date(completionLog[key].ts).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                </li>
            ))}
        </ul>
    );

    const renderCalendar = () => {
        const year = viewDate.getFullYear(), month = viewDate.getMonth();
        const monthName = viewDate.toLocaleString(lang, { month: 'long', year: 'numeric' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = new Date(year, month, 1).getDay();
        const today = new Date();
        const isCurrentMonthView = today.getFullYear() === year && today.getMonth() === month;
        const completedDates = new Set(completionKeys);
        const calendarDays = Array.from({ length: startDayOfWeek }, (_, i) => <div key={`blank-${i}`} className="h-9 w-9"></div>);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = isoDate(date);
            const isCompleted = completedDates.has(dateKey);
            const isToday = isCurrentMonthView && day === today.getDate();
            calendarDays.push(
                <div key={day} className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors
                    ${isToday ? 'border-2 border-brand-sky' : ''}
                    ${isCompleted ? 'bg-brand-green font-bold text-black' : 'bg-slate-100 dark:bg-brand-card'}
                `}>{day}</div>
            );
        }

        const changeMonth = (offset: number) => setViewDate(current => {
            const newDate = new Date(current); newDate.setDate(1); newDate.setMonth(newDate.getMonth() + offset); return newDate;
        });

        const dayLabels = lang === 'id' ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <Button onClick={() => changeMonth(-1)} className="px-3 py-1 text-lg">‹</Button>
                    <strong className="text-lg font-semibold">{monthName}</strong>
                    <Button onClick={() => changeMonth(1)} className="px-3 py-1 text-lg">›</Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-brand-muted">{dayLabels.map((d, i) => <div key={i} className="font-bold">{d}</div>)}</div>
                <div className="mt-2 grid grid-cols-7 place-items-center gap-1 text-center">{calendarDays}</div>
            </div>
        );
    };

    return (
        <dialog ref={dialogRef} onClose={onClose} className="w-full max-w-lg rounded-2xl border-none bg-transparent p-0 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm">
            <div className="rounded-2xl border border-slate-300 dark:border-brand-line bg-white dark:bg-brand-panel p-4 text-slate-900 dark:text-brand-text">
                <div className="flex items-center">
                    <strong className="text-lg">{t('completionHistory')}: <span className="font-normal">{name}</span></strong>
                    <div className="flex-grow"></div>
                    <button type="button" onClick={onClose} className="text-2xl leading-none">&times;</button>
                </div>
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                <div className="p-2">
                    {completionKeys.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 dark:text-brand-muted">{t('noCompletions')}</p>
                    ) : habit.freq === 'daily' ? renderCalendar() : renderList()}
                </div>
            </div>
        </dialog>
    );
};
