import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, EqSurahInfo, EqSurahDetail } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';

export const QuranReader: React.FC<{
    t: (k: string) => string;
    lang: Language;
}> = ({ t, lang }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [surahs, setSurahs] = useState<EqSurahInfo[]>([]);
    const [selectedSurah, setSelectedSurah] = useState<EqSurahDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
    const [selectedReciter, setSelectedReciter] = useState<string>('05');
    const [goToSurah, setGoToSurah] = useState<string>('');
    const [surahSearchTerm, setSurahSearchTerm] = useState('');

    const API_BASE = 'https://equran.id/api/v2';

    const stopCurrentAudio = useCallback(() => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.src = '';
            setCurrentAudio(null);
            setPlayingAudioUrl(null);
        }
    }, [currentAudio]);

    useEffect(() => {
        const fetchSurahs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/surat`);
                if (!res.ok) throw new Error('Failed to fetch surah list');
                const json = await res.json();
                if (json.code !== 200) throw new Error(json.message);
                setSurahs(json.data);
            } catch (e: any) {
                setError(t('errorFetching'));
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSurahs();
        return () => {
            stopCurrentAudio();
        };
    }, [t, stopCurrentAudio]);

    const handleSelectSurah = useCallback(async (surahNumber: number) => {
        stopCurrentAudio();
        setView('detail');
        setIsLoading(true);
        setSelectedSurah(null);
        setError(null);
        window.scrollTo(0, 0);
        try {
            const res = await fetch(`${API_BASE}/surat/${surahNumber}`);
            if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);
            const json = await res.json();
            if (json.code !== 200) throw new Error(json.message);
            setSelectedSurah(json.data);
        } catch (e: any) {
            setError(t('errorFetching'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [t, stopCurrentAudio]);

    const handlePlayAudio = (audioUrl: string) => {
        if (currentAudio && playingAudioUrl === audioUrl && !currentAudio.paused) {
            currentAudio.pause();
            setPlayingAudioUrl(null);
        } else {
            stopCurrentAudio();
            const audio = new Audio(audioUrl);
            audio.onended = () => {
                setPlayingAudioUrl(null);
                setCurrentAudio(null);
            };
            setCurrentAudio(audio);
            setPlayingAudioUrl(audioUrl);
            audio.play();
        }
    };
    
    const handleGoToSurah = useCallback(() => {
        const surahNum = parseInt(goToSurah, 10);
        if (!isNaN(surahNum) && surahNum >= 1 && surahNum <= 114) {
            handleSelectSurah(surahNum);
            setGoToSurah('');
        } else {
            alert(t('invalidSurahNumber'));
        }
    }, [goToSurah, handleSelectSurah, t]);
    
    const filteredSurahs = useMemo(() => {
        if (!surahs) return [];
        const term = surahSearchTerm.toLowerCase().trim();
        if (!term) return surahs;
        return surahs.filter(surah => 
            surah.namaLatin.toLowerCase().includes(term) ||
            surah.nomor.toString().includes(term)
        );
    }, [surahs, surahSearchTerm]);


    const reciterOptions = [
        { value: '01', name: 'Abdullah Al-Juhany' },
        { value: '02', name: 'Abdul Muhsin Al-Qasim' },
        { value: '03', name: 'Abdurrahman as-Sudais' },
        { value: '04', name: 'Ibrahim Al-Dossari' },
        { value: '05', name: 'Misyari Rasyid Al-Afasi' },
    ];

    if (isLoading && surahs.length === 0) {
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
                        <strong className="flex items-center gap-2 text-lg">📖 {t('quran')}</strong>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('searchSurahPlaceholder')}
                                value={surahSearchTerm}
                                onChange={e => setSurahSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card"
                            />
                            <Icon className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-brand-muted">🔎</Icon>
                        </div>
                        <div className="my-1 h-px bg-slate-200 dark:bg-brand-line"></div>
                        {error && <div className="py-10 text-center text-red-500">{error}</div>}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSurahs.map(surah => (
                                <div key={surah.nomor} className="flex cursor-pointer flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-500 hover:bg-white dark:border-brand-line dark:bg-brand-card dark:hover:border-sky-400 dark:hover:bg-brand-panel" onClick={() => handleSelectSurah(surah.nomor)}>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold dark:bg-brand-bg">{surah.nomor}</span>
                                            <span className="text-2xl font-bold" dir="rtl">{surah.nama}</span>
                                        </div>
                                        <h3 className="mt-2 font-bold overflow-hidden text-ellipsis whitespace-nowrap">{surah.namaLatin}</h3>
                                        <p className="text-sm text-slate-500 dark:text-brand-muted">{surah.arti}</p>
                                    </div>
                                    <div className="mt-2 text-right text-xs text-slate-400 dark:text-slate-500">
                                        {surah.tempatTurun} • {surah.jumlahAyat} {t('verses')}
                                    </div>
                                </div>
                            ))}
                            {filteredSurahs.length === 0 && surahs.length > 0 && (
                                <div className="col-span-full py-10 text-center text-slate-500 dark:text-brand-muted">
                                    {t('noResultsFound')}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-grow">
                        <button onClick={() => { setView('list'); stopCurrentAudio(); }} className="mb-4 rounded-full bg-slate-100 px-4 py-1 font-semibold text-sky-600 hover:bg-slate-200 dark:bg-brand-card dark:text-sky-400 dark:hover:bg-brand-line">
                            &larr; {t('backToList')}
                        </button>
                        {isLoading && <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>}
                        {error && <div className="py-10 text-center text-red-500">{error}</div>}
                        {selectedSurah && (
                            <div className="flex-grow overflow-y-auto pr-2">
                                <div className="mb-6 rounded-lg border border-slate-200 dark:border-brand-line bg-slate-100 dark:bg-brand-card p-6 text-center">
                                    <h2 className="mb-2 text-3xl font-bold">
                                        {selectedSurah.nomor}. {selectedSurah.namaLatin}{' '}
                                        <span className="font-serif text-4xl" dir="rtl">({selectedSurah.nama})</span>
                                    </h2>
                                    <p className="text-slate-500 dark:text-brand-muted">"{selectedSurah.arti}"</p>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-brand-muted">{selectedSurah.tempatTurun} • {selectedSurah.jumlahAyat} {t('verses')}</p>
                                    <details className="group mt-4 text-left">
                                        <summary className="cursor-pointer text-center text-sm font-semibold text-sky-600 dark:text-sky-400">Deskripsi</summary>
                                        <div dangerouslySetInnerHTML={{ __html: selectedSurah.deskripsi }} className="mt-2 text-sm text-slate-600 dark:text-slate-400" />
                                    </details>
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-500 dark:text-brand-muted mb-1">Audio Full Surat</p>
                                        <audio controls key={selectedSurah.nomor} src={selectedSurah.audioFull[selectedReciter]} className="w-full">Your browser does not support the audio element.</audio>
                                    </div>
                                </div>
                                {selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
                                     <div className="mb-8 text-center"><p className="text-3xl leading-relaxed" dir="rtl">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p><p className="text-sm text-slate-500 dark:text-brand-muted">Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.</p></div>
                                )}
                                <div className="space-y-6">
                                    {selectedSurah.ayat.map((verse) => (
                                        <div key={verse.nomorAyat} className="rounded-lg border border-slate-200 dark:border-brand-line p-4">
                                            <div className="mb-4 flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-500 dark:text-brand-muted">{selectedSurah.nomor}:{verse.nomorAyat}</span>
                                                <div className="flex items-center gap-2">
                                                    <select value={selectedReciter} onChange={e => setSelectedReciter(e.target.value)} className="rounded border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-1 text-xs outline-none focus:border-sky-500">
                                                        {reciterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                                                    </select>
                                                    <button onClick={() => handlePlayAudio(verse.audio[selectedReciter])} className="text-2xl" aria-label={`Play audio for verse ${verse.nomorAyat}`}>
                                                        {playingAudioUrl === verse.audio[selectedReciter] ? '⏸️' : '▶️'}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-right font-serif text-3xl leading-relaxed" dir="rtl">{verse.teksArab} <span className="font-sans text-lg font-normal text-sky-600 dark:text-sky-400">﴿{verse.nomorAyat}﴾</span></p>
                                            <p className="mt-3 text-left text-sm italic text-sky-700 dark:text-sky-400">{verse.teksLatin}</p>
                                            <p className="mt-4 text-left text-slate-600 dark:text-brand-muted">{verse.teksIndonesia} ({selectedSurah.nomor}:{verse.nomorAyat})</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 grid grid-cols-3 items-center gap-2">
                                    <div className="text-left">
                                        {(() => {
                                            const prev = selectedSurah.suratSebelumnya;
                                            return prev ? (<Button onClick={() => handleSelectSurah(prev.nomor)}>&larr; {prev.namaLatin}</Button>) : null;
                                        })()}
                                    </div>
                                    
                                    <div className="flex items-center justify-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="114"
                                            value={goToSurah}
                                            onChange={(e) => setGoToSurah(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleGoToSurah(); }}
                                            placeholder={t('surahNumberPlaceholder')}
                                            className="w-24 rounded-md border border-slate-300 bg-slate-50 p-2 text-center outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card"
                                        />
                                        <Button onClick={handleGoToSurah}>{t('goTo')}</Button>
                                    </div>

                                    <div className="text-right">
                                        {(() => {
                                            const next = selectedSurah.suratSelanjutnya;
                                            return next ? (<Button onClick={() => handleSelectSurah(next.nomor)}>{next.namaLatin} &rarr;</Button>) : null;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
