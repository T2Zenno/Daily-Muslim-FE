import React from 'react';
import { Language } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';

export const Header: React.FC<{
    t: (k: string, r?: any) => string;
    lang: Language;
    onLangChange: (l: Language) => void;
    theme: 'light' | 'dark';
    onThemeChange: (t: 'light' | 'dark') => void;
    onAddHabit: () => void;
    onEnableReminders: () => void;
    onExport: () => void;
    onImportClick: () => void;
    username: string | null;
    onLogout: () => void;
}> = ({ t, lang, onLangChange, theme, onThemeChange, onAddHabit, onEnableReminders, onExport, onImportClick, username, onLogout }) => (
    <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-brand-line bg-white/80 dark:bg-brand-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 p-4">
            <h1 className="text-xl font-extrabold">🟢 Daily Muslim</h1>
            <div className="flex-grow"></div>
            <div className="flex flex-wrap items-center gap-2">
                 <Pill>
                    <label className="text-xs text-slate-500 dark:text-brand-muted">{t('theme')}</label>
                    <button onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} className="flex items-center gap-1 bg-transparent outline-none">
                        {theme === 'light' ? '☀️' : '🌙'}
                        <span className="capitalize">{t(theme)}</span>
                    </button>
                </Pill>
                <Pill>
                    <label className="text-xs text-slate-500 dark:text-brand-muted">{t('language')}</label>
                    <select value={lang} onChange={e => onLangChange(e.target.value as Language)} className="bg-transparent outline-none">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                    </select>
                </Pill>
                {username && (
                    <>
                        <Pill className="hidden sm:flex">
                            <span className="text-sm">{t('welcomeUser', { user: username })}</span>
                        </Pill>
                         <Button onClick={onEnableReminders} className="bg-sky-100 border-sky-200 text-sky-800 hover:bg-sky-200 dark:bg-sky-500/20 dark:border-sky-500/50 dark:hover:bg-sky-500/30 dark:text-sky-300">
                            <Icon>🔔</Icon>{t('enableReminders')}
                        </Button>
                        <Button onClick={onAddHabit} className="bg-green-100 border-green-200 text-green-800 hover:bg-green-200 font-bold dark:bg-green-500/20 dark:border-green-500/50 dark:hover:bg-green-500/30 dark:text-green-300">
                            ＋ {t('addHabit')}
                        </Button>
                        <Button onClick={onLogout} className="border-red-300 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30">
                            <Icon>➡️</Icon>{t('logout')}
                        </Button>
                    </>
                )}
            </div>
        </div>
    </header>
);