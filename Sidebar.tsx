import React from 'react';
import { Language, HabitFrequency, DirectoryNode, Module } from './types';
import { TABS, HIJRI_MONTHS } from './constants';
import { gregorianToHijri } from './utils';
import { Icon, Badge } from './ui';

const HijriDateDisplay: React.FC<{ t: (k: string) => string; date: Date, lang: Language }> = ({ t, date, lang }) => {
    const hijri = gregorianToHijri(date);
    const hijriMonths = HIJRI_MONTHS[lang];
    const formatted = `${hijri.hd} ${hijriMonths[hijri.hm - 1]} ${hijri.hy} H`;
    return (
        <div className="mt-2 text-center text-sm text-slate-500 dark:text-brand-muted">
             {formatted}
        </div>
    );
};

const DirectoryTree: React.FC<{
    t: (k: string) => string;
    node: DirectoryNode;
    path: string;
    onSelect: (path: string) => void;
    onEdit: (path: string) => void;
    selectedPath: string;
    lang: Language;
    expandedDirs: Set<string>;
    onToggleDir: (path: string) => void;
}> = ({ t, node, path, onSelect, onEdit, selectedPath, lang, expandedDirs, onToggleDir }) => (
    <ul className="space-y-1 pl-2">
        {Object.keys(node.children || {}).sort().map(key => {
            const childNode = node.children[key];
            const newPath = path ? `${path}/${key}` : key;
            const isSelected = selectedPath === newPath;
            const isExpanded = expandedDirs.has(newPath);
            const hasChildren = Object.keys(childNode.children).length > 0 || childNode.items.length > 0;

            return (
                <li key={newPath}>
                    <div className="group flex items-center">
                        <button onClick={() => hasChildren && onToggleDir(newPath)} className={`w-6 text-center text-xs transition-transform ${hasChildren ? '' : 'text-transparent'} ${isExpanded ? 'rotate-90' : ''}`} aria-expanded={isExpanded} aria-label={`Toggle ${key}`}>
                            {hasChildren ? '▶' : '•'}
                        </button>
                        <button onClick={() => onSelect(newPath)} className={`flex-grow rounded px-2 py-1 text-left text-sm font-semibold transition ${isSelected ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'group-hover:bg-slate-100 dark:group-hover:bg-brand-card'}`}>
                            {key}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(newPath); }} title={t('editCategory')} className="w-6 text-center text-xs text-slate-400 opacity-0 transition group-hover:opacity-100 dark:text-brand-muted">
                            ✏️
                        </button>
                    </div>
                    {isExpanded && hasChildren && (
                        <DirectoryTree t={t} node={childNode} path={newPath} onSelect={onSelect} selectedPath={selectedPath} lang={lang} expandedDirs={expandedDirs} onToggleDir={onToggleDir} onEdit={onEdit} />
                    )}
                </li>
            );
        })}
{node.items.filter(item => item != null && typeof item === 'object' && 'id' in item && item.names != null).sort((a,b)=>((a?.names?.[lang] || a?.names?.id || '').localeCompare(b?.names?.[lang] || b?.names?.id || ''))).map(item => (
    <li key={item?.id ?? 'unknown'} className="pl-4">
        <button onClick={() => onSelect(item.cat)} className={`w-full rounded px-2 py-0.5 text-left text-xs text-slate-500 hover:text-slate-800 dark:text-brand-muted dark:hover:text-brand-text ${selectedPath === item.cat ? 'bg-sky-100/50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-400' : ''}`}>
            <span className="mr-2 opacity-50">-</span>{item.names?.[lang] ?? item.names?.id ?? 'Unknown'}
        </button>
    </li>
))}
    </ul>
);


export const Sidebar: React.FC<{
    t: (k: string, r?: any) => string;
    lang: Language;
    progressData: { doneCount: number, totalCount: number, percentage: number, bestStreak: number };
    activeTab: HabitFrequency;
    onTabChange: (tab: HabitFrequency) => void;
    filters: { search: string, showWajib: boolean, showSunnah: boolean, dirCategory: string };
    onFilterChange: (key: any, value: any) => void;
    directoryTree: DirectoryNode;
    expandedDirs: Set<string>;
    onToggleDir: (path: string) => void;
    onEditCategory: (path: string) => void;
    modules: Module[];
    activeView: string;
    onSelectView: (view: string) => void;
}> = ({ t, lang, progressData, activeTab, onTabChange, filters, onFilterChange, directoryTree, expandedDirs, onToggleDir, onEditCategory, modules, activeView, onSelectView }) => (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4">
        <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
            <strong className="flex items-center gap-2">🧭 {t('todayProgress')}</strong>
            <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
            <div className="h-2.5 overflow-hidden rounded-full border border-slate-200 dark:border-brand-line bg-slate-100 dark:bg-brand-card">
                <div className="h-full bg-gradient-to-r from-brand-green to-emerald-500 transition-all duration-500" style={{ width: `${progressData.percentage}%` }}></div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-brand-muted">
                <span>{progressData.doneCount}/{progressData.totalCount} ({progressData.percentage}%)</span>
                <span>🏆 {t('best')}: {progressData.bestStreak}</span>
            </div>
            <HijriDateDisplay t={t} date={new Date()} lang={lang} />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
            <strong className="flex items-center gap-2">🗂️ {t('view')}</strong>
            <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
            <div className="flex flex-wrap gap-2">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => { onTabChange(tab.id); onSelectView('tracker'); }}
                        className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${activeView === 'tracker' && activeTab === tab.id ? 'border-transparent bg-brand-green text-black' : 'border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card hover:border-slate-400 dark:hover:border-slate-700'}`}>
                        {tab.icon} {t(tab.labelKey)}
                    </button>
                ))}
            </div>
            <div className="relative mt-3">
                <Icon className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-brand-muted">🔎</Icon>
                <input type="text" value={filters.search} onChange={e => onFilterChange('search', e.target.value)} placeholder={t('searchPlaceholder')}
                    className="w-full rounded-full border border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card py-2 pl-9 pr-3 outline-none focus:border-sky-500" />
            </div>
             <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Badge className="border-green-300 bg-green-100 text-green-800 dark:border-green-500/50 dark:bg-green-500/20 dark:text-green-300">{t('wajib')}</Badge>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card px-2 py-1 text-xs">
                        <input type="checkbox" checked={filters.showWajib} onChange={e => onFilterChange('showWajib', e.target.checked)} className="accent-brand-green" /> On
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-500/50 dark:bg-sky-500/20 dark:text-sky-300">{t('sunnah')}</Badge>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 dark:border-brand-line bg-slate-100 dark:bg-brand-card px-2 py-1 text-xs">
                        <input type="checkbox" checked={filters.showSunnah} onChange={e => onFilterChange('showSunnah', e.target.checked)} className="accent-brand-sky" /> On
                    </label>
                </div>
            </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
             <strong className="flex items-center gap-2">📖 {t('directory')}</strong>
             <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
             <DirectoryTree t={t} node={directoryTree} path="" onSelect={path => onFilterChange('dirCategory', path)} selectedPath={filters.dirCategory} lang={lang} expandedDirs={expandedDirs} onToggleDir={onToggleDir} onEdit={onEditCategory} />
             <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
             <p className="text-xs text-slate-500 dark:text-brand-muted">{t('directoryHint')}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
             <strong className="flex items-center gap-2">🛠️ {t('otherFeatures')}</strong>
             <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
             <div className="flex flex-col gap-1">
                <button onClick={() => onSelectView('tracker')} className={`flex items-center gap-3 rounded-md p-2 text-left font-semibold transition text-sm ${activeView === 'tracker' ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-brand-card'}`}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-200 text-lg dark:bg-green-500/30">✅</div>
                    <span>{t('checklist')}</span>
                </button>
                <button onClick={() => onSelectView('analytics')} className={`flex items-center gap-3 rounded-md p-2 text-left font-semibold transition text-sm ${activeView === 'analytics' ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-brand-card'}`}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-200 text-lg dark:bg-sky-500/30">📊</div>
                    <span>{t('analytics')}</span>
                </button>
                {modules?.filter(m => m && m.id).map(module => (
                    <button key={module.id} onClick={() => onSelectView(module.id)} className={`flex items-center gap-3 rounded-md p-2 text-left font-semibold transition text-sm ${activeView === module.id ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-brand-card'}`}>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-lg dark:bg-slate-700">{module.icon}</div>
                        <span>{module.customTitles[lang] || t(module.defaultTitleKey)}</span>
                    </button>
                ))}
             </div>
        </div>
         <div className="rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
            <strong className="flex items-center gap-2">ℹ️ {t('tips')}</strong>
            <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
            <p className="text-xs text-slate-500 dark:text-brand-muted">{t('tipText')}</p>
        </div>
    </aside>
);
