import React, { useState } from 'react';
import { Habit, HabitFrequency, DBState, Streak } from './types';
import { Badge, Button } from './ui';
import { periodKey, isDueThisPeriod } from './utils';
import { DAY_OF_WEEK_OPTIONS } from './constants';

const ReminderInfo: React.FC<{ habit: Habit; t: (k: string) => string; }> = ({ habit, t }) => {
    const { schedule, freq } = habit;
    if (!schedule.time) return null;

    let detailsText: string = '';

    if (!schedule.reminderEnabled) {
        detailsText = t('allDays');
    } else {
        const noSpecificReminder = !schedule.reminderDow?.length && !schedule.reminderDom?.length && !schedule.reminderMdom?.length;
        if (noSpecificReminder) {
            detailsText = t('allDays');
        } else {
            switch (freq) {
                case 'daily':
                case 'weekly':
                    if (schedule.reminderDow && schedule.reminderDow.length > 0) {
                        const dowMap = new Map(DAY_OF_WEEK_OPTIONS.map(opt => [opt.value, opt.label]));
                        const sortedDow = [...schedule.reminderDow].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
                        detailsText = sortedDow.map(d => dowMap.get(d)).filter(Boolean).join(', ');
                    }
                    break;
                case 'monthly':
                    if (schedule.reminderDom && schedule.reminderDom.length > 0) {
                        detailsText = `Day ${schedule.reminderDom.join(', ')}`;
                    }
                    break;
                case 'yearly':
                    if (schedule.reminderMonth && schedule.reminderMdom && schedule.reminderMdom.length > 0) {
                        const monthName = new Date(0, schedule.reminderMonth - 1).toLocaleString('en-US', { month: 'short' });
                        detailsText = `${monthName} ${schedule.reminderMdom.join(', ')}`;
                    }
                    break;
                default:
                    detailsText = t('allDays');
            }
        }
    }
    
    return (
        <Badge>
            ⏰ {schedule.time} {detailsText ? `(${detailsText})` : ''}
        </Badge>
    );
};

const StreakIndicator: React.FC<{ streak: Streak; t: (k: string) => string; target?: number; }> = ({ streak, t, target }) => {
    const { current, best } = streak;
    const isGoalMet = target && target > 0 && current >= target;
    const getStreakStyle = (streakCount: number) => {
        if (isGoalMet) return { colorClass: 'text-emerald-500 dark:text-emerald-400', glowClass: 'animate-pulse' };
        if (streakCount >= 30) return { colorClass: 'text-red-500 dark:text-red-400', glowClass: 'animate-pulse' };
        if (streakCount >= 7) return { colorClass: 'text-orange-500 dark:text-orange-400', glowClass: '' };
        if (streakCount > 0) return { colorClass: 'text-amber-500 dark:text-amber-400', glowClass: '' };
        return { colorClass: 'text-slate-400 dark:text-brand-muted', glowClass: '' };
    };
    const { colorClass, glowClass } = getStreakStyle(current);

    return (
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-brand-muted">
            {isGoalMet && <span title={t('streakGoalReached')}>🎉</span>}
            <span className={`font-bold transition-colors duration-500 ${colorClass} ${glowClass}`} title={`${t('streak')}: ${current}`}>
                🔥 {current} {target && target > 0 ? `/ ${target}` : ''}
            </span>
            <span className="opacity-50">•</span>
            <span title={`${t('best')} ${t('streak')}: ${best}`}>🏆 {best}</span>
        </div>
    );
};

const HabitCard: React.FC<{
    t: (k: string) => string; lang: string; habit: Habit; isDone: boolean; onToggle: (id: string) => void; onEdit: (id: string) => void; onShowHistory: (id: string) => void; isToggling: boolean;
}> = React.memo(({ t, lang, habit, isDone, onToggle, onEdit, onShowHistory, isToggling }) => {
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);
    const name = habit.names[lang] || habit.names.id;
    const noteSnippet = habit.notes.length > 80 ? habit.notes.substring(0, 80) + '...' : habit.notes;

    return (
        <div className={`flex items-start gap-3 rounded-lg border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-card p-3 transition ${!isDueThisPeriod(habit) ? 'opacity-60' : ''}`}>
            <input type="checkbox" checked={!!isDone} onChange={() => onToggle(habit.id)} disabled={isToggling} className="mt-1 h-5 w-5 rounded border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-brand-green focus:ring-2 focus:ring-green-500" />
            <div className="flex-grow min-w-0">
                <p className="font-bold break-words">{name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge className={habit.type === 'wajib' ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-500/50 dark:bg-green-500/20 dark:text-green-300' : 'border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-500/50 dark:bg-sky-500/20 dark:text-sky-300'}>{t(habit.type)}</Badge>
                    <Badge>📂 {habit.cat || '—'}</Badge>
                    {habit.schedule.useHijri && <Badge>🌙 {t('hijriBased')}</Badge>}
                    <ReminderInfo habit={habit} t={t} />
                </div>
                {habit.notes && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-brand-muted italic cursor-pointer whitespace-pre-wrap" onClick={() => setIsNotesExpanded(!isNotesExpanded)} title={t('clickToToggle')}>
                        {isNotesExpanded ? habit.notes : noteSnippet}
                    </p>
                )}
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
                 <div className="flex items-center gap-1">
                    <Button onClick={() => onShowHistory(habit.id)} className="px-3 py-1 text-xs">🗓️ {t('history')}</Button>
                    <Button onClick={() => onEdit(habit.id)} className="px-3 py-1 text-xs">✏️ {t('edit')}</Button>
                </div>
                <StreakIndicator streak={habit.streak} t={t} target={habit.targetStreak} />
            </div>
        </div>
    );
});

export const HabitList: React.FC<{
    t: (k: string) => string;
    habits: Habit[];
    onToggle: (id: string) => void;
    onEdit: (id: string) => void;
    onShowHistory: (id: string) => void;
    activeTab: HabitFrequency;
    completions: DBState['completions'];
    isToggling: Set<string>;
}> = ({ t, habits, onToggle, onEdit, onShowHistory, activeTab, completions, isToggling }) => {
    const periodLabelMap: Record<HabitFrequency, string> = {
        daily: 'periodDaily', weekly: 'periodWeekly', monthly: 'periodMonthly',
        yearly: 'periodYearly', special: 'periodSpecial'
    };
    
    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                <div className="flex items-center">
                    <strong className="flex items-center gap-2">✅ {t('checklist')}</strong>
                    <div className="flex-grow"></div>
                    <span className="text-xs text-slate-500 dark:text-brand-muted">{t(periodLabelMap[activeTab])}</span>
                </div>
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                <div className="flex flex-col gap-3">
                    {habits.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 dark:text-brand-muted">{t('noItems')}</p>
                    ) : (
                        habits.map(habit => {
                            const pk = periodKey(habit);
                            const isDone = completions[habit.id]?.[pk]?.done;
                            return <HabitCard key={`${habit.id}-${habit.createdAt}`} t={t} habit={habit} isDone={isDone} onToggle={onToggle} onEdit={onEdit} onShowHistory={onShowHistory} isToggling={isToggling.has(habit.id)} />;
                        })
                    )}
                </div>
            </div>
        </section>
    );
};