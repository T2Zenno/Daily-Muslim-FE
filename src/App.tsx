import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type Language, type Habit, type DBState, type HabitFrequency, type DirectoryNode, type HabitNames } from './lib/types';
import { I18N, DEFAULT_MODULES } from './lib/constants';
import { isoDate, isoWeek, periodKey, seed, uid, isDueThisPeriod, isReminderScheduledForToday } from './lib/utils';
import { login, register, logout, getUser, getHabits, createHabit, updateHabit, deleteHabit, getCompletions, toggleCompletion, exportData, importData, type User, type HabitApi, type CompletionApi } from './api/api';

import { ScrollToTopButton, LoadingPopup } from './lib/ui';
import { Header } from './views/Header';
import { Sidebar } from './views/Sidebar';
import { HabitList } from './views/HabitComponents';
import { HabitModal } from './modals/HabitModal';
import { HistoryModal } from './modals/HistoryModal';
import { AnalyticsView } from './views/AnalyticsView';
import { ModuleView } from './views/ModuleView';
import { CategoryModal } from './modals/CategoryModal';
import { QuranReader } from './views/QuranReader';
import { DuaReader } from './views/DuaReader';
import { PrayerTimesView } from './views/PrayerTimesView';
import { HadithReader } from './views/HadithReader';
import { ZakatCalculator } from './views/ZakatCalculator';
import { InheritanceCalculator } from './views/InheritanceCalculator';
import { Auth } from './modals/Auth';


export default function App() {
    // --- STATE MANAGEMENT ---
    const [user, setUser] = useState<User | null>(null);
    const [db, setDb] = useState<DBState | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const [lang, setLang] = useState<Language>((localStorage.getItem('dm_lang') as Language) || 'id');
    const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('dm_theme') as 'light' | 'dark') || 'dark');
    const [activeTab, setActiveTab] = useState<HabitFrequency>((localStorage.getItem('dm_tab') as HabitFrequency) || 'daily');
    const [activeView, setActiveView] = useState<string>('tracker');
    const [filters, setFilters] = useState({
        search: '',
        showWajib: true,
        showSunnah: true,
        category: '',
        dirCategory: ''
    });
    const [modalState, setModalState] = useState<{ isOpen: boolean; habitId?: string }>({ isOpen: false });

    const [historyModalState, setHistoryModalState] = useState<{ isOpen: boolean; habitId?: string }>({ isOpen: false });
    const [categoryModalState, setCategoryModalState] = useState<{ isOpen: boolean; currentPath?: string }>({ isOpen: false });
    const [expandedDirs, setExpandedDirs] = useState(() => new Set<string>());
    const [togglingHabits, setTogglingHabits] = useState(new Set<string>());
    const importFileRef = useRef<HTMLInputElement>(null);

    // --- LOAD DATA ---
    const loadData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            const [habitsApi, completionsApi] = await Promise.all([
                getHabits(),
                getCompletions()
            ]);

            // Map habits
            const habits: Habit[] = habitsApi.map(h => ({
                id: h.id.toString(),
                names: typeof h.names === 'string' ? JSON.parse(h.names) : h.names,
                type: h.type,
                freq: h.frequency as HabitFrequency,
                cat: h.category || '',
                schedule: typeof h.schedule === 'string' ? JSON.parse(h.schedule) : h.schedule,
                notes: h.notes || '',
                active: h.active,
                streak: {
                    current: typeof h.streak === 'string' ? JSON.parse(h.streak).current : h.streak.current,
                    best: typeof h.streak === 'string' ? JSON.parse(h.streak).longest : h.streak.longest,
                    last: '' // TODO: calculate from completions
                },
                createdAt: new Date(h.created_at).getTime(),
                targetStreak: h.target_streak || undefined
            }));

            // Map completions
            const completions: { [habitId: string]: { [periodKey: string]: { done: boolean; ts: number } } } = {};
            completionsApi.forEach(c => {
                const habitId = c.habit_id.toString();
                const period = periodKey({ freq: habits.find(h => h.id === habitId)?.freq || 'daily' } as Habit, new Date(c.date));
                if (!completions[habitId]) completions[habitId] = {};
                completions[habitId][period] = { done: c.completed, ts: new Date(c.created_at).getTime() };
            });

            const dbState: DBState = {
                habits,
                completions,
                notified: {},
                modules: DEFAULT_MODULES,
                version: 7,
                username: user.name,
                email: user.email
            };

            setDb(dbState);
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    // --- I18N HELPER ---
    const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
        let translation = I18N[lang]?.[key] || I18N['en'][key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
            });
        }
        return translation;
    }, [lang]);

    // --- PERSISTENCE & SIDE EFFECTS ---
    useEffect(() => {
        if (user) {
            setDb({ habits: [], completions: {}, notified: {}, modules: DEFAULT_MODULES, version: 7, username: user.name, email: user.email });
            loadData();
        } else {
            setDb(null);
        }
    }, [user, loadData]);

    useEffect(() => {
        const token = localStorage.getItem('api_token');
        if (token) {
            getUser().then(setUser).catch(() => localStorage.removeItem('api_token')).finally(() => setAuthChecked(true));
        } else {
            setAuthChecked(true);
        }
    }, []);

    useEffect(() => { localStorage.setItem('dm_lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('dm_tab', activeTab); }, [activeTab]);
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('dm_theme', theme);
    }, [theme]);

    // --- AUTH HANDLERS ---
    const handleLogin = async (email: string, pass: string): Promise<string | null> => {
        try {
            const response = await login(email, pass);
            setUser(response.user);
            return null;
        } catch (err: any) {
            return err.message || t('incorrectPassword');
        }
    };

    const handleRegister = async (user: string, email: string, pass: string, confirmPass: string): Promise<string | null> => {
        if (pass !== confirmPass) return t('passwordsDoNotMatch');
        try {
            const response = await register(user, email, pass, confirmPass);
            setUser(response.user);
            return null;
        } catch (err: any) {
            return err.message || t('emailInUse');
        }
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setDb(null);
    };

    // --- NOTIFICATION LOGIC ---
    const requestNotificationPermission = useCallback(async () => {
        if (!('Notification' in window)) { alert(t('browserNotSupported')); return; }
        if (Notification.permission === 'granted') { alert(t('remindersEnabled')); return; }
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') { alert(t('remindersEnabled')); } else { alert(t('permissionDenied')); }
        } else { alert(t('permissionDenied')); }
    }, [t]);

    useEffect(() => {
        if (!db) return;
        const ticker = setInterval(() => {
            if (Notification.permission !== 'granted') return;

            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            db.habits.forEach(h => {
                if (!h.active || !h.schedule.reminderEnabled || !h.schedule.time || h.schedule.time !== timeStr) return;
                if (!isReminderScheduledForToday(h, now)) return;
                const isDue = isDueThisPeriod(h, now);
                if (!isDue) return;

                const pk = periodKey(h, now);
                const isDone = db.completions[h.id]?.[pk]?.done;
                const notificationKey = `${h.id}@${pk}@${h.schedule.time}`;
                const alreadyNotified = db.notified[notificationKey];

                if (!isDone && !alreadyNotified) {
                    const name = h.names[lang] || h.names.id;
                    const body = `[${t(h.type)}] ${h.cat ? `[${h.cat}]` : ''} ${name}`;
                    new Notification('🔔 Daily Muslim', { body, tag: h.id });
                    setDb(prevDb => prevDb ? ({ ...prevDb, notified: { ...prevDb.notified, [notificationKey]: Date.now() } }) : null);
                }
            });
        }, 15000);
        return () => clearInterval(ticker);
    }, [db, lang, t]);

    // --- BUSINESS LOGIC & DERIVED STATE ---
    const recomputeStreak = useCallback((habitId: string) => {
        setDb(prevDb => {
            if (!prevDb) return null;
            const newDb = { ...prevDb };
            const habit = newDb.habits.find(h => h.id === habitId);
            if (!habit) return prevDb;

            const completions = newDb.completions[habitId] || {};
            let currentStreak = 0;
            const todayKey = periodKey(habit, new Date());
            const isDone = (key: string) => completions[key]?.done;

            const getPrevKey = (key: string): string | null => {
                try {
                    if (habit.freq === 'daily') { const [y, m, d] = key.split('-').map(Number); const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() - 1); return isoDate(dt); }
                    if (habit.freq === 'weekly') { const [yearStr, weekStr] = key.split('-W'); const year = Number(yearStr); const week = Number(weekStr); if (week > 1) return `${year}-W${String(week - 1).padStart(2, '0')}`; const prevYear = new Date(year - 1, 11, 31); return isoWeek(prevYear); }
                    if (habit.freq === 'monthly') { const [y, m] = key.split('-').map(Number); const dt = new Date(y, m - 1, 1); dt.setMonth(dt.getMonth() - 1); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; }
                    if (habit.freq === 'yearly') return String(Number(key) - 1);
                } catch { return null; }
                return null;
            }

            if (isDone(todayKey)) {
                currentStreak = 1;
                let prevKey = getPrevKey(todayKey);
                while(prevKey && isDone(prevKey)) { currentStreak++; prevKey = getPrevKey(prevKey); }
            } else {
                 const yesterdayKey = getPrevKey(todayKey);
                 if (!yesterdayKey || !isDone(yesterdayKey)) { currentStreak = 0; } 
                 else { currentStreak = 1; let prevKey = getPrevKey(yesterdayKey); while(prevKey && isDone(prevKey)) { currentStreak++; prevKey = getPrevKey(prevKey); } }
            }

            habit.streak.current = currentStreak;
            habit.streak.best = Math.max(habit.streak.best || 0, currentStreak);
            habit.streak.last = Object.keys(completions).sort().reverse()[0] || '';
            
            const target = habit.targetStreak;
            if (target && target > 0 && currentStreak === target) {
                const notificationKey = `streak_goal_${habit.id}_${target}`;
                if (!newDb.notified[notificationKey]) {
                    if (Notification.permission === 'granted') {
                        const name = habit.names[lang] || habit.names.id;
                        const title = t('streakGoalReached');
                        const body = t('streakGoalReachedBody', { target: String(target), habitName: name });
                        new Notification(`🎉 ${title}`, { body });
                    }
                    newDb.notified[notificationKey] = Date.now();
                }
            }
            return { ...newDb, habits: [...newDb.habits], notified: { ...newDb.notified } };
        });
    }, [lang, t]);

    useEffect(() => {
        db?.habits.forEach(h => recomputeStreak(h.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db?.completions]); 

    const { categories, directoryTree, filteredHabits, progressData, activeModule } = useMemo(() => {
        if (!db) return { categories: [], directoryTree: { children: {}, items: [] }, filteredHabits: [], progressData: { doneCount: 0, totalCount: 0, percentage: 0, bestStreak: 0 }, activeModule: undefined };

        const catSet = new Set<string>();
        db.habits.forEach(h => {
            if (h.cat) {
                const parts = h.cat.split('/');
                for (let i = 1; i <= parts.length; i++) { catSet.add(parts.slice(0, i).join('/')); }
            }
        });
        const categories = Array.from(catSet).sort();

        const root: DirectoryNode = { children: {}, items: [] };
        db.habits.forEach(h => {
            const path = (h.cat || t('other')).split('/');
            let node = root;
            path.forEach(part => {
                if (!node.children[part]) node.children[part] = { children: {}, items: [] };
                node = node.children[part];
            });
            node.items.push(h);
        });

        const activeCategory = filters.dirCategory || filters.category;
        const fHabits = db.habits
            .filter(h => h.active && h.freq === activeTab)
            .filter(h => {
                const { search, showWajib, showSunnah } = filters;
                if (h.type === 'wajib' && !showWajib) return false;
                if (h.type === 'sunnah' && !showSunnah) return false;
                if(activeCategory && !(h.cat||'').toLowerCase().startsWith(activeCategory.toLowerCase())) return false;
                const q = search.trim().toLowerCase();
                if (q) {
                    const name = (h.names[lang] || h.names.id).toLowerCase();
                    const notes = h.notes.toLowerCase();
                    const cat = h.cat.toLowerCase();
                    return name.includes(q) || notes.includes(q) || cat.includes(q);
                }
                return true;
            })
            .sort((a, b) => {
                const isDueA = isDueThisPeriod(a), isDueB = isDueThisPeriod(b);
                if (isDueA !== isDueB) return isDueB ? 1 : -1;
                const catA = a.cat || '', catB = b.cat || '';
                if (catA !== catB) return catA.localeCompare(catB);
                if (a.type !== b.type) return a.type === 'wajib' ? -1 : 1;
                const timeA = a.schedule.time || '99:99', timeB = b.schedule.time || '99:99';
                if (timeA !== timeB) return timeA.localeCompare(timeB);
                return ((a.names[lang] ?? a.names.id ?? '')).localeCompare((b.names[lang] ?? b.names.id ?? ''));
            });

        const dueHabits = db.habits.filter(h => h.active && h.freq === 'daily' && isDueThisPeriod(h));
        const todayPk = periodKey({freq: 'daily'} as Habit);
        const doneCount = dueHabits.filter(h => db.completions[h.id]?.[todayPk]?.done).length;
        const totalCount = dueHabits.length;
        const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
        const bestStreak = db.habits.reduce((max, h) => Math.max(max, h.streak?.best || 0), 0);
        const pData = { doneCount, totalCount, percentage, bestStreak };
        
        const actModule = db.modules.find(m => m.id === activeView);

        return { categories, directoryTree: root, filteredHabits: fHabits, progressData: pData, activeModule: actModule };
    }, [db, t, filters, activeTab, lang, activeView]);

    // --- EVENT HANDLERS ---
    const handleFilterChange = (key: keyof typeof filters, value: string | boolean) => {
        if (key === 'dirCategory') {
            setFilters(f => {
                const newDirCategory = f.dirCategory === value ? '' : value as string;
                if (newDirCategory) {
                    const pathParts = newDirCategory.split('/');
                    setExpandedDirs(prev => {
                        const newSet = new Set(prev);
                        for (let i = 1; i <= pathParts.length; i++) {
                            newSet.add(pathParts.slice(0, i).join('/'));
                        }
                        return newSet;
                    });
                }
                setActiveView('tracker');
                return { ...f, dirCategory: newDirCategory, category: '' };
            });
        } else if (key === 'category') {
             setFilters(f => ({ ...f, category: value as string, dirCategory: '' }));
             setActiveView('tracker');
        } else { setFilters(f => ({ ...f, [key]: value })); }
    };
    
    const handleToggleCompletion = async (habitId: string) => {
        setTogglingHabits(prev => new Set(prev).add(habitId));
        // Optimistic update
        setDb(prevDb => {
            if (!prevDb) return null;
            const newDb = { ...prevDb };
            const habit = newDb.habits.find(h => h.id === habitId);
            if (!habit) return prevDb;
            const pk = periodKey(habit);
            const completions = newDb.completions[habitId] || {};
            const wasDone = completions[pk]?.done || false;
            completions[pk] = { done: !wasDone, ts: Date.now() };
            newDb.completions[habitId] = completions;
            return newDb;
        });
        recomputeStreak(habitId);

        try {
            const response = await toggleCompletion(parseInt(habitId));
            // Update with server response
            setDb(prevDb => {
                if (!prevDb) return null;
                const newDb = { ...prevDb };
                const habit = newDb.habits.find(h => h.id === habitId);
                if (!habit) return prevDb;
                const pk = periodKey(habit);
                const completions = newDb.completions[habitId] || {};
                completions[pk] = { done: response.completion.completed, ts: new Date(response.completion.created_at).getTime() };
                newDb.completions[habitId] = completions;
                // Update habit streak from response
                const habitIndex = newDb.habits.findIndex(h => h.id === habitId);
                if (habitIndex > -1) {
                    const streakData = typeof response.habit.streak === 'string' ? JSON.parse(response.habit.streak) : response.habit.streak;
                    newDb.habits[habitIndex].streak = {
                        current: streakData.current,
                        best: streakData.longest,
                        last: '' // Will be recalculated
                    };
                }
                return newDb;
            });
            recomputeStreak(habitId);
        } catch (e) {
            console.error('Failed to toggle completion', e);
            // Revert optimistic update
            setDb(prevDb => {
                if (!prevDb) return null;
                const newDb = { ...prevDb };
                const habit = newDb.habits.find(h => h.id === habitId);
                if (!habit) return prevDb;
                const pk = periodKey(habit);
                const completions = newDb.completions[habitId] || {};
                if (completions[pk]) {
                    completions[pk] = { ...completions[pk], done: !completions[pk].done };
                }
                newDb.completions[habitId] = completions;
                return newDb;
            });
            recomputeStreak(habitId);
        } finally {
            setTogglingHabits(prev => {
                const newSet = new Set(prev);
                newSet.delete(habitId);
                return newSet;
            });
        }
    };

    const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'streak' | 'createdAt' | 'active'>, id?: string) => {
        try {
            if (id) {
                // Update existing habit via API
                const updatedHabit = await updateHabit(parseInt(id), {
                    names: habitData.names,
                    type: habitData.type,
                    frequency: habitData.freq,
                    category: habitData.cat,
                    schedule: habitData.schedule,
                    notes: habitData.notes,
                    target_streak: habitData.targetStreak,
                    active: true,
                });
                setDb(prevDb => {
                    if (!prevDb) return null;
                    const newDb = { ...prevDb };
                    const index = newDb.habits.findIndex(h => h.id === id);
                    if (index > -1) {
                        newDb.habits[index] = {
                            id: updatedHabit.id.toString(),
                            names: typeof updatedHabit.names === 'string' ? JSON.parse(updatedHabit.names) : updatedHabit.names,
                            type: updatedHabit.type,
                            freq: updatedHabit.frequency as HabitFrequency,
                            cat: updatedHabit.category || '',
                            schedule: typeof updatedHabit.schedule === 'string' ? JSON.parse(updatedHabit.schedule) : updatedHabit.schedule,
                            notes: updatedHabit.notes || '',
                            active: updatedHabit.active,
                            streak: {
                                current: updatedHabit.streak.current,
                                best: updatedHabit.streak.longest,
                                last: '',
                            },
                            createdAt: new Date(updatedHabit.created_at).getTime(),
                            targetStreak: updatedHabit.target_streak || undefined,
                        };
                    }
                    return newDb;
                });
            } else {
                // Create new habit via API
                const newHabit = await createHabit({
                    names: habitData.names,
                    type: habitData.type,
                    frequency: habitData.freq,
                    category: habitData.cat,
                    schedule: habitData.schedule,
                    notes: habitData.notes,
                    target_streak: habitData.targetStreak,
                    active: true,
                    streak: { current: 0, longest: 0 },
                });
                const newId = newHabit.id.toString();
                setDb(prevDb => {
                    if (!prevDb) return null;
                    const newDb = { ...prevDb };
                    if (!newDb.habits.some(h => h.id === newId)) {
                        newDb.habits.push({
                            id: newId,
                            names: typeof newHabit.names === 'string' ? JSON.parse(newHabit.names) : newHabit.names,
                            type: newHabit.type,
                            freq: newHabit.frequency as HabitFrequency,
                            cat: newHabit.category || '',
                            schedule: typeof newHabit.schedule === 'string' ? JSON.parse(newHabit.schedule) : newHabit.schedule,
                            notes: newHabit.notes || '',
                            active: newHabit.active,
                            streak: {
                                current: newHabit.streak.current,
                                best: newHabit.streak.longest,
                                last: '',
                            },
                            createdAt: new Date(newHabit.created_at).getTime(),
                            targetStreak: newHabit.target_streak || undefined,
                        });
                    }
                    return newDb;
                });
            }
            setModalState({ isOpen: false });
        } catch (e) {
            console.error('Failed to save habit', e);
            alert(t('saveFailed'));
        }
    };

    const handleDeleteHabit = async (habitId: string) => {
        if (window.confirm(t('deleteConfirm'))) {
            try {
                await deleteHabit(parseInt(habitId));
                setDb(prevDb => {
                    if (!prevDb) return null;
                    const newDb = { ...prevDb };
                    newDb.habits = newDb.habits.filter(h => h.id !== habitId);
                    delete newDb.completions[habitId];
                    return newDb;
                });
                setModalState({ isOpen: false });
            } catch (e) {
                console.error('Failed to delete habit', e);
                alert(t('deleteFailed'));
            }
        }
    };

    const handleExport = () => {
        if (!db) return;
        const data = JSON.stringify(db, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-muslim-data-${db.username}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const result = JSON.parse(reader.result as string);
                if (!result.habits) throw new Error(t('invalidFile'));
                // Import habits
                for (const h of result.habits) {
                    try {
                        await createHabit({
                            names: h.names,
                            type: h.type,
                            frequency: h.freq,
                            category: h.cat,
                            schedule: h.schedule,
                            notes: h.notes,
                            target_streak: h.targetStreak,
                            active: h.active,
                            streak: h.streak,
                        });
                    } catch (e) {
                        console.error('Failed to import habit', e);
                    }
                }

                // Reload data
                loadData();
                alert(t('importSuccess'));
            } catch (err: any) { alert(`${t('importFailed')} ${err.message}`); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleToggleDir = (path: string) => { setExpandedDirs(prev => { const newSet = new Set(prev); if (newSet.has(path)) newSet.delete(path); else newSet.add(path); return newSet; }); };

    const handleEditCategory = (oldPath: string) => {
        setCategoryModalState({ isOpen: true, currentPath: oldPath });
    };

    const handleSaveCategory = async (newPath: string) => {
        const oldPath = categoryModalState.currentPath;
        if (!oldPath) return;
        if (newPath && newPath.trim() && newPath !== oldPath) {
            try {
                // Update each affected habit via API
                const habitsToUpdate = db.habits.filter(h => h.cat === oldPath || h.cat.startsWith(oldPath + '/'));
                for (const habit of habitsToUpdate) {
                    const updatedCat = habit.cat === oldPath ? newPath : habit.cat.replace(oldPath, newPath);
                    await updateHabit(parseInt(habit.id), { category: updatedCat });
                }
                // Update local state
                setDb(prevDb => {
                    if (!prevDb) return null;
                    const newHabits = prevDb.habits.map(h => {
                        if (h.cat === oldPath) return { ...h, cat: newPath };
                        if (h.cat.startsWith(oldPath + '/')) return { ...h, cat: h.cat.replace(oldPath, newPath) };
                        return h;
                    });
                    return { ...prevDb, habits: newHabits };
                });
                alert(t('categoryRenameSuccess'));
            } catch (e) {
                console.error('Failed to update category', e);
                alert(t('saveFailed'));
            }
        }
        setCategoryModalState({ isOpen: false, currentPath: undefined });
    };


    
    // --- RENDER ---
    if (!authChecked) {
        return (
            <div className="bg-slate-50 text-slate-900 dark:bg-brand-bg dark:text-brand-text">
                <LoadingPopup />
            </div>
        );
    }

    if (!user) {
        return <Auth onLogin={handleLogin} onRegister={handleRegister} t={t} theme={theme} onThemeChange={setTheme} lang={lang} onLangChange={setLang} />;
    }

    if (!db) {
        return (
            <div className="bg-slate-50 text-slate-900 dark:bg-brand-bg dark:text-brand-text">
                <LoadingPopup />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 text-slate-900 dark:bg-brand-bg dark:text-brand-text">
            <Header
                t={t}
                lang={lang}
                onLangChange={setLang}
                theme={theme}
                onThemeChange={setTheme}
                onAddHabit={() => setModalState({ isOpen: true })}
                onEnableReminders={requestNotificationPermission}
                onExport={handleExport}
                onImportClick={() => importFileRef.current?.click()}
                username={db.username}
                onLogout={handleLogout}
            />
            
            <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept="application/json" />

            <main className="mx-auto max-w-7xl p-4">
                <div className="grid grid-cols-12 gap-4">
                    <Sidebar
                        t={t}
                        lang={lang}
                        progressData={progressData}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        directoryTree={directoryTree}
                        expandedDirs={expandedDirs}
                        onToggleDir={handleToggleDir}
                        onEditCategory={handleEditCategory}
                        modules={db.modules}
                        activeView={activeView}
                        onSelectView={setActiveView}
                    />
                    {activeView === 'tracker' ? (
                        <HabitList
                            t={t}
                            habits={filteredHabits}
                            onToggle={handleToggleCompletion}
                            onEdit={(id) => setModalState({ isOpen: true, habitId: id })}
                            onShowHistory={(id) => setHistoryModalState({ isOpen: true, habitId: id })}
                            activeTab={activeTab}
                            completions={db.completions}
                            isToggling={togglingHabits}
                        />
                    ) : activeView === 'analytics' ? (
                        <AnalyticsView
                            habits={db.habits}
                            completions={db.completions}
                            t={t}
                            lang={lang}
                            theme={theme}
                        />
                    ) : activeView === 'quran' ? (
                        <QuranReader t={t} lang={lang} />
                    ) : activeView === 'duas' ? (
                        <DuaReader t={t} lang={lang} />
                    ) : activeView === 'prayer_times' ? (
                        <PrayerTimesView t={t} lang={lang} />
                    ) : activeView === 'hadith' ? (
                        <HadithReader t={t} lang={lang} />
                    ) : activeView === 'zakat' ? (
                        <ZakatCalculator t={t} lang={lang} />
                    ) : activeView === 'inheritance' ? (
                        <InheritanceCalculator t={t} lang={lang} theme={theme} />
                    ) : activeModule ? (
                         <ModuleView
                            key={activeModule.id + lang}
                            module={activeModule}
                            t={t}
                            lang={lang}
                         />
                    ) : null}
                </div>
            </main>

            {modalState.isOpen && <HabitModal isOpen={modalState.isOpen} habitToEdit={db.habits.find(h => h.id === modalState.habitId)} onClose={() => setModalState({ isOpen: false })} onSave={handleSaveHabit} onDelete={handleDeleteHabit} t={t} lang={lang} />}
            {historyModalState.isOpen && <HistoryModal isOpen={historyModalState.isOpen} habit={db.habits.find(h => h.id === historyModalState.habitId)} completions={db.completions[historyModalState.habitId || '']} onClose={() => setHistoryModalState({ isOpen: false })} t={t} lang={lang} />}
            {categoryModalState.isOpen && <CategoryModal isOpen={categoryModalState.isOpen} currentPath={categoryModalState.currentPath || ''} onClose={() => setCategoryModalState({ isOpen: false, currentPath: undefined })} onSave={handleSaveCategory} t={t} />}
            {loadingData && <LoadingPopup />}
            <ScrollToTopButton />
        </div>
    );
}
