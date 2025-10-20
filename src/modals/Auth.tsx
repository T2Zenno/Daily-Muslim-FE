import React, { useState, FormEvent } from 'react';
import { Language } from '../lib/types';
import { Button, Pill } from '../lib/ui';

export const Auth: React.FC<{
    t: (k: string) => string;
    onLogin: (email: string, pass: string) => Promise<string | null>;
    onRegister: (user: string, email: string, pass: string, confirmPass: string) => Promise<string | null>;
    theme: 'light' | 'dark';
    onThemeChange: (t: 'light' | 'dark') => void;
    lang: Language;
    onLangChange: (l: Language) => void;
}> = ({ t, onLogin, onRegister, theme, onThemeChange, lang, onLangChange }) => {
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            if (authMode === 'register') {
                if (!username.trim() || !email.trim() || !password.trim()) return;
                const result = await onRegister(username, email, password, confirmPassword);
                if (result) setError(result);
            } else {
                if (!email.trim() || !password.trim()) return;
                const result = await onLogin(email, password);
                if (result) setError(result);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSwitchMode = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setError(null);
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const inputClass = "mt-1 w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500";
    const labelClass = "text-sm font-semibold text-slate-600 dark:text-brand-muted";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-brand-bg dark:text-brand-text">
             <div className="absolute top-4 right-4 flex gap-2">
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
            </div>
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold">🟢 Daily Muslim</h1>
                    <p className="text-slate-500 dark:text-brand-muted mt-1">Wajib & Sunnah Habit Tracker</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-6 shadow-lg">
                     <h2 className="text-2xl font-bold text-center mb-4">
                        {authMode === 'login' ? t('login') : t('register')}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {authMode === 'register' && (
                            <div>
                                <label className={labelClass} htmlFor="username">{t('username')}</label>
                                <input id="username" type="text" placeholder={t('usernamePlaceholder')} value={username} onChange={e => setUsername(e.target.value)} required className={inputClass} autoComplete="username" />
                            </div>
                        )}
                        <div>
                            <label className={labelClass} htmlFor="email">{t('email')}</label>
                            <input id="email" type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} autoComplete="email" />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="password">{t('password')}</label>
                            <div className="relative">
                                <input id="password" type={showPassword ? "text" : "password"} placeholder={t('passwordPlaceholder')} value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} autoComplete={authMode === 'register' ? "new-password" : "current-password"} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        {authMode === 'register' && (
                            <div>
                                <label className={labelClass} htmlFor="confirmPassword">{t('confirmPassword')}</label>
                                <div className="relative">
                                    <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={t('confirmPasswordPlaceholder')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} autoComplete="new-password" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {error && <p className="rounded border border-red-500/30 bg-red-500/10 p-2 text-center text-sm text-red-500">{error}</p>}
                        
                        <Button type="submit" disabled={isSubmitting} className="w-full justify-center bg-sky-500 text-white font-bold hover:bg-sky-600 border-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 dark:border-sky-700">
                           {isSubmitting ? (authMode === 'register' ? t('registering') : t('loggingIn')) : (authMode === 'register' ? t('register') : t('login'))}
                        </Button>
                    </form>
                </div>
                 <div className="mt-4 text-center">
                    <button onClick={() => handleSwitchMode(authMode === 'login' ? 'register' : 'login')} className="text-sm text-sky-600 hover:underline dark:text-sky-400">
                        {authMode === 'login' ? t('noAccount') : t('haveAccount')} {authMode === 'login' ? t('register') : t('login')}
                    </button>
                </div>
            </div>
        </div>
    );
};
