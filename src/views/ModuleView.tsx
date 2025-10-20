import React, { useState } from 'react';
import { Language } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';
import { QiblaDirection } from './QiblaDirection';

export const ModuleView: React.FC<{
    module: Module;
    t: (k: string) => string;
    lang: Language;
}> = ({ module, t, lang }) => {
    const title = module.customTitles[lang] || t(module.defaultTitleKey);
    const content = module.content[lang] || '';

    if (module.id === 'qibla') {
        return <QiblaDirection />;
    }

    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-3xl dark:bg-sky-500/20">{module.icon}</div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-brand-text">{title}</h1>
                </div>

                <div className="flex-grow">
                    <div className="h-full w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-relaxed dark:border-brand-line dark:bg-brand-card">
                        {content || t('moduleContentPlaceholder')}
                    </div>
                </div>
            </div>
        </section>
    );
};
