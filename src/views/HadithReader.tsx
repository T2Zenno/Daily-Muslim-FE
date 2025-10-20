import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, HadithBook, Hadith, HadithDetail, HadithListResponseData } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';

// Pagination logic helper
const getPaginationItems = (currentPage: number, totalPages: number, pageNeighbours = 1) => {
    const totalNumbers = (pageNeighbours * 2) + 3; // e.g. 1 ... 4 5 6 ... 10
    const totalBlocks = totalNumbers + 2; // with '...'

    if (totalPages <= totalBlocks) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

    let pages: (number | string)[] = [1];

    if (startPage > 2) {
        pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    if (endPage < totalPages - 1) {
        pages.push('...');
    }
    
    pages.push(totalPages);
    
    return pages;
};


export const HadithReader: React.FC<{ t: (k: string) => string; lang: Language; }> = ({ t, lang }) => {
    const [view, setView] = useState<'list_books' | 'list_hadiths' | 'detail_hadith'>('list_books');
    const [books, setBooks] = useState<HadithBook[]>([]);
    const [selectedBook, setSelectedBook] = useState<HadithBook | null>(null);
    const [hadiths, setHadiths] = useState<Hadith[]>([]);
    const [hadithDetail, setHadithDetail] = useState<HadithDetail | null>(null);
    
    const [batchSize, setBatchSize] = useState<number>(20);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    const [searchTerm, setSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = 'https://api.hadith.gading.dev';

    const fetchBooks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/books`);
            if (!res.ok) throw new Error('Failed to fetch book list');
            const json = await res.json();
            if (json.error) throw new Error(json.message);
            setBooks(json.data);
        } catch (e: any) {
            setError(t('errorFetching'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const fetchHadiths = useCallback(async () => {
        if (!selectedBook) return;
        setIsLoading(true);
        setError(null);
        setHadiths([]);

        try {
            const start = (currentPage - 1) * batchSize + 1;
            const end = currentPage * batchSize;
            const res = await fetch(`${API_BASE}/books/${selectedBook.id}?range=${start}-${end}`);
            if (!res.ok) throw new Error('Failed to fetch hadiths');
            const json = await res.json();
            if (json.error) throw new Error(json.message);
            const data: HadithListResponseData = json.data;
            setHadiths(data.hadiths);
            setTotalPages(Math.ceil(data.available / batchSize));
        } catch (e: any) {
            setError(t('errorFetching'));
        } finally {
            setIsLoading(false);
        }
    }, [selectedBook, currentPage, batchSize, t]);
    
    useEffect(() => {
        if (view === 'list_hadiths') {
            fetchHadiths();
        }
    }, [fetchHadiths, view]);

    useEffect(() => {
        setCurrentPage(1);
    }, [batchSize, selectedBook]);

    const filteredHadiths = useMemo(() => {
        if (!searchTerm.trim()) {
            return hadiths;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return hadiths.filter(hadith =>
            hadith.arab.toLowerCase().includes(lowercasedTerm) ||
            hadith.id.toLowerCase().includes(lowercasedTerm)
        );
    }, [hadiths, searchTerm]);


    const handleSelectBook = (book: HadithBook) => {
        setSelectedBook(book);
        setView('list_hadiths');
        setSearchTerm('');
    };
    
    const handleSelectHadith = async (hadithNumber: number) => {
        if (!selectedBook) return;
        setIsLoading(true);
        setError(null);
        setHadithDetail(null);
        setView('detail_hadith');
        try {
             const res = await fetch(`${API_BASE}/books/${selectedBook.id}/${hadithNumber}`);
             if (!res.ok) throw new Error('Failed to fetch hadith detail');
             const json = await res.json();
             if (json.error) throw new Error(json.message);
             setHadithDetail(json.data);
        } catch(e: any) {
            setError(t('errorFetching'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBackToBookList = () => {
        setView('list_books');
        setSelectedBook(null);
        setHadiths([]);
    };

    const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);


    const renderBookList = () => (
        <>
            <strong className="flex items-center gap-2 text-lg">📜 {t('hadith_books')}</strong>
            <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
            {isLoading && <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>}
            {error && <div className="py-10 text-center text-red-500">{error}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {books.map(book => (
                    <div key={book.id} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-500 dark:border-brand-line dark:bg-brand-card dark:hover:border-sky-400">
                        <div>
                            <h3 className="font-bold text-lg overflow-hidden text-ellipsis whitespace-nowrap">{book.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-brand-muted">{t('hadiths_available').replace('{count}', book.available.toLocaleString())}</p>
                        </div>
                        <Button onClick={() => handleSelectBook(book)} className="mt-4 w-full justify-center">{t('view_hadiths')}</Button>
                    </div>
                ))}
            </div>
        </>
    );

    const renderHadithList = () => (
        <>
            <div className="flex flex-wrap items-center gap-4">
                 <Button onClick={handleBackToBookList}>&larr; {t('back_to_book_list')}</Button>
                 <h2 className="text-xl font-bold">{selectedBook?.name}</h2>
            </div>
            <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                 <div className="relative md:col-span-2">
                    <input type="text" placeholder={t('search_hadith_placeholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card" />
                    <Icon className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-brand-muted">🔎</Icon>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="batch-size" className="text-sm font-semibold">{t('batch_size')}:</label>
                    <select id="batch-size" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className="w-full rounded-md border border-slate-300 bg-slate-50 p-2 outline-none focus:border-sky-500 dark:border-brand-line dark:bg-brand-card">
                        {[10, 20, 50, 100, 300].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
            </div>
            {isLoading && <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>}
            {error && <div className="py-10 text-center text-red-500">{error}</div>}
            <div className="space-y-4">
                {filteredHadiths.map(hadith => (
                    <div key={hadith.number} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-brand-line dark:bg-brand-card">
                        <div className="flex justify-between items-center mb-2">
                            <Badge className="font-bold">No. {hadith.number}</Badge>
                            <Button onClick={() => handleSelectHadith(hadith.number)} className="px-3 py-1 text-xs">{t('viewDetail')}</Button>
                        </div>
                        <p className="text-right font-serif text-xl leading-relaxed" dir="rtl">{hadith.arab}</p>
                        <p className="mt-4 text-sm text-slate-600 dark:text-brand-muted" style={{textAlign: 'justify'}}>{hadith.id}</p>
                    </div>
                ))}
            </div>
            {filteredHadiths.length === 0 && !isLoading && <p className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('noResultsFound')}</p>}
            {totalPages > 1 && !searchTerm.trim() && (
                 <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
                    <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{t('prev')}</Button>
                    {paginationItems.map((item, index) =>
                        typeof item === 'number' ? (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(item)}
                                className={`rounded-lg border border-slate-300 dark:border-brand-line bg-slate-100 hover:bg-slate-200 dark:bg-brand-card px-4 py-2 font-semibold text-slate-800 dark:text-brand-text transition hover:border-slate-400 dark:hover:border-slate-700 ${currentPage === item ? 'border-sky-500 bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : ''}`}
                            >
                                {item}
                            </button>
                        ) : (
                            <span key={index} className="px-2 py-1 text-slate-500 dark:text-brand-muted">...</span>
                        )
                    )}
                    <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t('next')}</Button>
                </div>
            )}
        </>
    );

     const renderHadithDetail = () => (
        <>
             <Button onClick={() => setView('list_hadiths')}>&larr; {t('hadith')} {selectedBook?.name}</Button>
             <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
             {isLoading && <div className="py-10 text-center text-slate-500 dark:text-brand-muted">{t('loading')}</div>}
             {error && <div className="py-10 text-center text-red-500">{error}</div>}
             {hadithDetail && (
                 <div className="rounded-lg border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-card p-6">
                     <h2 className="text-2xl font-bold mb-4">{hadithDetail.name} - {t('hadith_number').replace('{number}', String(hadithDetail.contents.number))}</h2>
                     <div className="space-y-6">
                        <p className="text-right font-serif text-3xl leading-loose" dir="rtl">{hadithDetail.contents.arab}</p>
                        <div className="my-4 h-px bg-slate-200 dark:bg-brand-line"></div>
                        <p className="text-base text-slate-700 dark:text-brand-text leading-relaxed" style={{textAlign: 'justify'}}>{hadithDetail.contents.id}</p>
                     </div>
                 </div>
             )}
        </>
     );

    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex h-full min-h-[80vh] flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
               {view === 'list_books' && renderBookList()}
               {view === 'list_hadiths' && renderHadithList()}
               {view === 'detail_hadith' && renderHadithDetail()}
            </div>
        </section>
    );
};
