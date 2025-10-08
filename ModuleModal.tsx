import React, { useState, useEffect, useRef } from 'react';
import { Module, Language } from './types';
import { Button } from './ui';

export const ModuleModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (moduleId: string, newTitle: string, newContent: string) => void; moduleToEdit?: Module; t: (k: string) => string; lang: Language;
}> = ({ isOpen, onClose, onSave, moduleToEdit, t, lang }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const initialFormState = { title: '', content: '' };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isOpen) {
            if (moduleToEdit) {
                setFormData({
                    title: moduleToEdit.customTitles[lang] || t(moduleToEdit.defaultTitleKey),
                    content: moduleToEdit.content[lang] || '',
                });
            } else {
                setFormData(initialFormState);
            }
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, moduleToEdit, lang, t]);

    const handleChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        if (moduleToEdit) {
            onSave(moduleToEdit.id, formData.title.trim(), formData.content);
        }
        onClose();
    };

    const inputClass = "mt-1 w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500";
    const labelClass = "text-sm text-slate-600 dark:text-brand-muted";

    return (
        <dialog ref={dialogRef} onClose={onClose} className="w-full max-w-4xl rounded-2xl border-none bg-transparent p-0 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm">
            <div className="rounded-2xl border border-slate-300 dark:border-brand-line bg-white dark:bg-brand-panel p-4 text-slate-900 dark:text-brand-text">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center"><strong className="text-lg">{t('editModule')}</strong><div className="flex-grow"></div><button type="button" onClick={onClose} className="text-2xl">&times;</button></div>
                    <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                    <div className="grid grid-cols-1 gap-4">
                        <div><label className={labelClass}>{t('title')}</label><input required value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder={t('titlePlaceholder')} className={inputClass} /></div>
                        <div><label className={labelClass}>{t('content')}</label><textarea value={formData.content} onChange={e => handleChange('content', e.target.value)} rows={10} placeholder={t('moduleContentPlaceholder')} className={inputClass} /></div>
                    </div>
                    <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                    <div className="flex items-center gap-2">
                        <div className="flex-grow"></div>
                        <Button onClick={onClose}>{t('cancel')}</Button>
                        <Button type="submit" className="border-green-300 bg-green-100 text-green-800 hover:bg-green-200 font-bold dark:border-green-500/50 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30">💾 {t('save')}</Button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};
