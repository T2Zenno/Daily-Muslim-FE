import React, { useState, useEffect, useRef } from 'react';
import { Habit, HabitType, HabitFrequency, Language } from './types';
import { FREQUENCY_OPTIONS, DAY_OF_WEEK_OPTIONS, HIJRI_MONTHS } from './constants';
import { Button, Icon } from './ui';

export const HabitModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (data: any, id?: string) => Promise<void>; onDelete: (id: string) => void; habitToEdit?: Habit; t: (k: string) => string; lang: Language;
}> = ({ isOpen, onClose, onSave, onDelete, habitToEdit, t, lang }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const savingRef = useRef(false);
    const initialFormState = { name: '', type: 'wajib' as HabitType, freq: 'daily' as HabitFrequency, time: '', cat: '', notes: '', dow: [] as number[], dom: '', month: '', mdom: '', dates: '', targetStreak: '', reminderEnabled: true, reminderDow: [] as number[], reminderDom: '', reminderMonth: '', reminderMdom: '', useHijri: false, hdom: '', hmonth: '', hmdom: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            savingRef.current = false;
            setSaving(false);
            if (habitToEdit) {
                const s = habitToEdit.schedule;
                setFormData({
                    name: habitToEdit.names[lang] || habitToEdit.names.id || '',
                    type: habitToEdit.type,
                    freq: habitToEdit.freq,
                    time: s.time || '',
                    cat: habitToEdit.cat || '',
                    notes: habitToEdit.notes || '',
                    dow: s.dow || [],
                    dom: (s.dom || []).join(','),
                    month: s.month?.toString() || '',
                    mdom: (s.mdom || []).join(','),
                    dates: (s.dates || []).join('; '),
                    targetStreak: habitToEdit.targetStreak?.toString() || '',
                    reminderEnabled: s.reminderEnabled ?? !!s.time,
                    reminderDow: s.reminderDow || (habitToEdit.freq === 'weekly' ? s.dow : []) || [],
                    reminderDom: (s.reminderDom || []).join(','),
                    reminderMonth: s.reminderMonth?.toString() || '',
                    reminderMdom: (s.reminderMdom || []).join(','),
                    useHijri: s.useHijri || false,
                    hdom: (s.hdom || []).join(','),
                    hmonth: s.hmonth?.toString() || '',
                    hmdom: (s.hmdom || []).join(','),
                });
            } else {
                 setFormData(initialFormState);
            }
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, habitToEdit, lang]);

    const handleChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleDowChange = (day: number) => handleChange('dow', formData.dow.includes(day) ? formData.dow.filter(d => d !== day) : [...formData.dow, day]);
    const handleReminderDowChange = (day: number) => handleChange('reminderDow', formData.reminderDow.includes(day) ? formData.reminderDow.filter(d => d !== day) : [...formData.reminderDow, day]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        try {
            const parseNums = (str: string) => str.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
            const savedData = {
                names: { ...habitToEdit?.names, [lang]: formData.name.trim(), id: formData.name.trim() },
                type: formData.type, freq: formData.freq, cat: formData.cat.trim(), notes: formData.notes.trim(), targetStreak: Number(formData.targetStreak) || 0,
                schedule: {
                    time: formData.time,
                    dow: formData.dow,
                    dom: parseNums(formData.dom),
                    month: Number(formData.month) || null,
                    mdom: parseNums(formData.mdom),
                    dates: formData.dates.split(';').map(s => s.trim()).filter(Boolean),
                    reminderEnabled: formData.reminderEnabled,
                    reminderDow: formData.reminderDow,
                    reminderDom: parseNums(formData.reminderDom),
                    reminderMonth: Number(formData.reminderMonth) || null,
                    reminderMdom: parseNums(formData.reminderMdom),
                    useHijri: formData.useHijri,
                    hdom: parseNums(formData.hdom),
                    hmonth: Number(formData.hmonth) || null,
                    hmdom: parseNums(formData.hmdom),
                 }
            };
            await onSave(savedData, habitToEdit?.id);
            onClose();
        } catch (error) {
            console.error('Failed to save habit', error);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const inputClass = "mt-1 w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500";
    const labelClass = "text-sm text-slate-600 dark:text-brand-muted";
    const hijriMonths = HIJRI_MONTHS[lang];

    const renderReminderScheduleOptions = () => {
        switch (formData.freq) {
            case 'daily':
            case 'weekly':
                return (
                    <div className="md:col-span-2">
                        <label className={labelClass}>{t('reminderDays')}</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {DAY_OF_WEEK_OPTIONS.map(day => <label key={day.value} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card px-3 py-1 text-sm">
                                <input type="checkbox" value={day.value} checked={formData.reminderDow.includes(day.value)} onChange={() => handleReminderDowChange(day.value)} className="accent-brand-sky" />{day.label}
                            </label>)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-brand-muted">{t('reminderDaysHint')}</p>
                    </div>
                );
            case 'monthly':
                 return <div><label className={labelClass}>{t('reminderDayOfMonth')}</label><input value={formData.reminderDom} onChange={e => handleChange('reminderDom', e.target.value)} placeholder={t('domExample')} className={inputClass} /></div>;
            case 'yearly':
                 return <div className="grid grid-cols-2 gap-4"><label className={`col-span-2 ${labelClass}`}>{t('reminderMonthDay')}</label><input type="number" min="1" max="12" value={formData.reminderMonth} onChange={e => handleChange('reminderMonth', e.target.value)} placeholder={t('month')} className={inputClass} /><input value={formData.reminderMdom} onChange={e => handleChange('reminderMdom', e.target.value)} placeholder={t('domExample')} className={inputClass} /></div>;
            default:
                return null;
        }
    };

    return (
        <dialog ref={dialogRef} onClose={onClose} className="w-full max-w-3xl rounded-2xl border-none bg-transparent p-0 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm">
            <div className="rounded-2xl border border-slate-300 dark:border-brand-line bg-white dark:bg-brand-panel p-4 text-slate-900 dark:text-brand-text">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center"><strong className="text-lg">{habitToEdit ? t('modalTitleEdit') : t('modalTitleAdd')}</strong><div className="flex-grow"></div><button type="button" onClick={onClose} className="text-2xl">&times;</button></div>
                    <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                         <div><label className={labelClass}>{t('name')}</label><input required value={formData.name} onChange={e=>handleChange('name',e.target.value)} placeholder={t('namePlaceholder')} className={inputClass}/></div>
                         <div><label className={labelClass}>{t('type')}</label><select value={formData.type} onChange={e=>handleChange('type',e.target.value as HabitType)} className={inputClass}><option value="wajib">{t('wajib')}</option><option value="sunnah">{t('sunnah')}</option></select></div>
                         <div><label className={labelClass}>{t('frequency')}</label><select value={formData.freq} onChange={e=>handleChange('freq',e.target.value as HabitFrequency)} className={inputClass}>{FREQUENCY_OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}</select></div>
                         
                         <div className="md:col-span-2"><label className={labelClass}>📂 {t('category')}</label><input value={formData.cat} onChange={e=>handleChange('cat',e.target.value)} placeholder={t('categoryExample')} className={inputClass}/><p className="mt-1 text-xs text-slate-500 dark:text-brand-muted">{t('subCategoryHint')}</p></div>
                        
                        {(formData.freq === 'monthly' || formData.freq === 'yearly') && (
                            <div className="md:col-span-2"><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={formData.useHijri} onChange={e => handleChange('useHijri', e.target.checked)} className="h-4 w-4 rounded accent-brand-sky"/> <Icon>🌙</Icon> {t('useHijriCalendar')}</label></div>
                        )}

                        {formData.freq === 'weekly' && <div className="md:col-span-2"><label className={labelClass}>{t('days')}</label><div className="mt-2 flex flex-wrap gap-2">{DAY_OF_WEEK_OPTIONS.map(day=><label key={day.value} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card px-3 py-1 text-sm"><input type="checkbox" value={day.value} checked={formData.dow.includes(day.value)} onChange={()=>handleDowChange(day.value)} className="accent-brand-sky"/>{day.label}</label>)}</div></div>}
                        {formData.freq === 'monthly' && (formData.useHijri ? <div><label className={labelClass}>{t('dayOfMonthHijri')}</label><input value={formData.hdom} onChange={e=>handleChange('hdom',e.target.value)} placeholder={t('domExample')} className={inputClass}/></div> : <div><label className={labelClass}>{t('dayOfMonth')}</label><input value={formData.dom} onChange={e=>handleChange('dom',e.target.value)} placeholder={t('domExample')} className={inputClass}/></div>)}
                        {formData.freq === 'yearly' && (formData.useHijri ? <div className="grid grid-cols-2 gap-4"><label className={`col-span-2 ${labelClass}`}>{t('monthAndDayHijri')}</label><select value={formData.hmonth} onChange={e=>handleChange('hmonth',e.target.value)} className={inputClass}><option value="">-- {t('monthHijri')} --</option>{hijriMonths.map((m,i) => <option key={i} value={i+1}>{m}</option>)}</select><input value={formData.hmdom} onChange={e=>handleChange('hmdom',e.target.value)} placeholder={t('domExample')} className={inputClass}/></div> : <div className="grid grid-cols-2 gap-4"><label className={`col-span-2 ${labelClass}`}>{t('monthDay')}</label><input type="number" min="1" max="12" value={formData.month} onChange={e=>handleChange('month',e.target.value)} placeholder={t('month')} className={inputClass}/><input value={formData.mdom} onChange={e=>handleChange('mdom',e.target.value)} placeholder={t('domExample')} className={inputClass}/></div>)}
                        {formData.freq === 'special' && <div><label className={labelClass}>{t('specificDates')}</label><input value={formData.dates} onChange={e=>handleChange('dates',e.target.value)} placeholder={t('datesExample')} className={inputClass}/></div>}
                        
                         <div className="md:col-span-2 rounded-lg border border-slate-200 dark:border-brand-line p-3">
                            <label className="flex cursor-pointer items-center gap-2 font-semibold">
                                <input type="checkbox" checked={formData.reminderEnabled} onChange={e => handleChange('reminderEnabled', e.target.checked)} className="h-4 w-4 rounded accent-brand-sky" />
                                🔔 {t('reminders')}
                            </label>
                            {formData.reminderEnabled && (
                                <div className="mt-3 grid grid-cols-1 gap-4 border-t border-slate-200 dark:border-brand-line pt-3 md:grid-cols-2">
                                    <div>
                                        <label className={labelClass}>{t('reminderTime')}</label>
                                        <input type="time" value={formData.time} onChange={e=>handleChange('time',e.target.value)} className={inputClass}/>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-brand-muted">{t('reminderHint')}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                       {renderReminderScheduleOptions()}
                                    </div>
                                </div>
                            )}
                        </div>

                         <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClass}>{t('targetStreak')}</label><input type="number" min="1" value={formData.targetStreak} onChange={e => handleChange('targetStreak', e.target.value)} placeholder="e.g., 7" className={inputClass} /></div>
                        </div>
                         <div className="md:col-span-2"><label className={labelClass}>{t('notes')}</label><textarea value={formData.notes} onChange={e=>handleChange('notes',e.target.value)} rows={3} placeholder={t('notesPlaceholder')} className={inputClass}/></div>
                    </div>
                    <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                    <div className="flex items-center gap-2">
                        {habitToEdit && <Button onClick={() => onDelete(habitToEdit.id)} className="border-red-300 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30">🗑️ {t('delete')}</Button>}
                        <div className="flex-grow"></div>
                        <Button onClick={onClose} disabled={saving}>{t('cancel')}</Button>
                        <Button type="submit" disabled={saving} className="border-green-300 bg-green-100 text-green-800 hover:bg-green-200 font-bold dark:border-green-500/50 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30">💾 {saving ? t('saving') : t('save')}</Button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};
