import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EqDuaListItem, EqDuaDetail, Language } from './types';
import { Button, Badge } from './ui';

export const DuaReader: React.FC<{
    t: (k: string) => string;
    lang: Language;
}> = ({ t, lang }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [duas, setDuas] = useState<EqDuaListItem[]>([]);
    const [selectedDua, setSelectedDua] = useState<EqDuaDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const API_BASE = 'https://equran.id/api';

    const fetchDuas = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/doa`);
            if (!res.ok) throw new Error('Failed to fetch dua list');
            const json = await res.json();
            if (json.status !== 'success') throw new Error(json.message || 'API error');
            setDuas(json.data);
        } catch (e: any) {
            setError(t('errorFetching'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchDuas();
    }, [fetchDuas]);

    const handleSelectDua = useCallback(async (duaId: number) => {
        setView('detail');
        setIsLoading(true);
        setSelectedDua(null);
        setError(null);
        window.scrollTo(0, 0);
        try {
            const res = await fetch(`${API_BASE}/doa/${duaId}`);
            if (!res.ok) throw new Error(`Failed to fetch dua ${duaId}`);
            const json = await res.json();
            if (json.status !== 'success') throw new Error(json.message || 'API error');
            setSelectedDua(json.data);
        } catch (e: any) {
            setError(t('errorFetching'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const categories = useMemo(() => {
        if (!duas) return [];
        return [...new Set(duas.map(d => d.grup))].sort();
    }, [duas]);

    const filteredDuas = useMemo(() => {
        return duas.filter(dua => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = dua.nama.toLowerCase().includes(term) || dua.grup.toLowerCase().includes(term);
            const matchesCategory = !selectedCategory || dua.grup === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [duas, searchTerm, selectedCategory]);
    
    if (isLoading && duas.length === 0) {
        return (
            <section className="col-span-12 lg:col-span-8">
                <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                    <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>
                </div>
            </section>
        );
    }
    
    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex h-full min-h-[80vh] flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                {view === 'list' ? (
                    <>
                        <strong className="flex items-center gap-2 text-lg">🤲 {t('duas')}</strong>
                        <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder={t('searchDuaPlaceholder')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500"
                            />
                            <select 
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500"
                                aria-label={t('filterByCategory')}
                            >
                                <option value="">{t('allCategories')}</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        {error ? (
                            <div className="py-10 text-center text-red-500">
                                {error}
                                <Button onClick={fetchDuas} className="ml-4">{t('retry')}</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                                {filteredDuas.map(dua => (
                                    <div key={dua.id} className="flex cursor-pointer flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-500 hover:bg-white dark:border-brand-line dark:bg-brand-card dark:hover:border-sky-400 dark:hover:bg-brand-panel" onClick={() => handleSelectDua(dua.id)}>
                                        <div>
                                            <Badge className="mb-2">{dua.grup}</Badge>
                                            <h3 className="font-bold">{dua.nama}</h3>
                                            <p className="mt-2 text-right text-sm text-slate-500 dark:text-brand-muted" dir="rtl">{dua.ar.substring(0, 50)}...</p>
                                        </div>
                                        <div className="mt-3 text-right">
                                            <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">{t('viewDetail')} &rarr;</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                     <div className="flex-grow">
                        <button onClick={() => { setView('list'); }} className="mb-4 rounded-full bg-slate-100 px-4 py-1 font-semibold text-sky-600 hover:bg-slate-200 dark:bg-brand-card dark:text-sky-400 dark:hover:bg-brand-line">
                            &larr; {t('backToListDua')}
                        </button>
                        {isLoading && <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>}
                        {error && <div className="py-10 text-center text-red-500">{error}</div>}
                        {selectedDua && (
                            <div className="space-y-6 rounded-lg border border-slate-200 dark:border-brand-line p-6">
                                <div>
                                    <Badge className="mb-2">{selectedDua.grup}</Badge>
                                    <h2 className="text-2xl font-bold">{selectedDua.nama}</h2>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-right font-serif text-3xl leading-relaxed" dir="rtl">{selectedDua.ar}</p>
                                    <p className="text-left text-base italic text-sky-700 dark:text-sky-400">{selectedDua.tr}</p>
                                    <p className="text-left text-slate-600 dark:text-brand-muted">{selectedDua.idn}</p>
                                </div>
                                <div className="border-t border-slate-200 dark:border-brand-line pt-4">
                                    <p className="text-xs text-slate-500 dark:text-brand-muted">
                                        <strong className="font-semibold">{t('source')}:</strong> {selectedDua.tentang}
                                    </p>
                                    {selectedDua.tag && selectedDua.tag.length > 0 && (
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <strong className="text-xs font-semibold text-slate-500 dark:text-brand-muted">{t('tags')}:</strong>
                                            {selectedDua.tag.map(t => <Badge key={t}>{t}</Badge>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
