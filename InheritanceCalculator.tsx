import React, { useState, useMemo, useEffect } from 'react';
import { Language } from './types';
import { Button, Icon } from './ui';
import { faroidh } from './faroidh';

// UMD library from CDN
declare const Recharts: any;

// Flag for script loading
declare global {
  interface Window {
    rechartsLoaded?: boolean;
  }
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <span className="group relative ml-1">
        <Icon className="cursor-help text-sky-500">ℹ️</Icon>
        <span className="absolute bottom-full mb-2 w-64 -translate-x-1/2 left-1/2 scale-0 transform rounded bg-slate-800 p-2 text-xs text-white transition-all group-hover:scale-100 dark:bg-slate-700 z-10">
            {text}
        </span>
    </span>
);

export const InheritanceCalculator: React.FC<{ t: (k: string, r?: any) => string; lang: Language; theme: 'light' | 'dark'; }> = ({ t, lang, theme }) => {
    const [step, setStep] = useState(1);
    const [inputs, setInputs] = useState<any>({
        totalEstate: '',
        assetRelatedDebt: 0,
        nonAssetRelatedDebt: 0,
        funeralExpenses: 0,
        bequest: 0,
    });
    const [heirs, setHeirs] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [warnings, setWarnings] = useState<any>({});
    const [results, setResults] = useState<any>(null);
    const [isRechartsLoaded, setIsRechartsLoaded] = useState(window.rechartsLoaded === true);

    useEffect(() => {
        if (isRechartsLoaded) return;
        const interval = setInterval(() => {
            if (window.rechartsLoaded === true) {
                setIsRechartsLoaded(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [isRechartsLoaded]);
    
    const heirList = useMemo(() => faroidh.getHeirList(), []);

    const validateStep1 = () => {
        const newErrors: any = {};
        if (!inputs.totalEstate || inputs.totalEstate <= 0) {
            newErrors.totalEstate = t('error_totalEstateRequired');
        } else if (isNaN(inputs.totalEstate)) {
            newErrors.totalEstate = t('error_invalidPositiveNumber');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const validateStep2 = () => {
        const newErrors: any = {};
        const newWarnings: any = {};
        const liabilities = {
            assetRelatedDebt: Number(inputs.assetRelatedDebt) || 0,
            nonAssetRelatedDebt: Number(inputs.nonAssetRelatedDebt) || 0,
            funeralExpenses: Number(inputs.funeralExpenses) || 0,
            bequest: Number(inputs.bequest) || 0,
        };

        for (const key in liabilities) {
            if (liabilities[key as keyof typeof liabilities] < 0) {
                newErrors[key] = t('error_inputCannotBeNegative');
            }
        }
        
        const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
        if (totalLiabilities > inputs.totalEstate) {
            newErrors.total = t('error_liabilitiesExceedEstate');
        }

        if (liabilities.bequest > inputs.totalEstate / 3) {
            newWarnings.bequest = t('warning_bequestAdjusted');
        }

        setErrors(newErrors);
        setWarnings(newWarnings);
        return Object.keys(newErrors).length === 0;
    };
    
    const validateStep3 = () => {
        const newErrors: any = {};
        for(const heirKey in heirs) {
            const count = heirs[heirKey];
            if (count < 0 || !Number.isInteger(Number(count))) {
                 newErrors[heirKey] = t('error_mustBeInteger');
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
        else if (step === 3 && validateStep3()) {
            setStep(4);
            handleCalculate();
        };
    };

    const handleBack = () => setStep(s => Math.max(1, s - 1));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs((p: any) => ({ ...p, [name]: value === '' ? '' : Number(value) }));
    };

    const handleHeirChange = (heirKey: string, value: string) => {
        const count = value === '' ? 0 : parseInt(value, 10);
        setHeirs((p: any) => ({ ...p, [heirKey]: isNaN(count) ? 0 : count }));
    };
    
    const handleReset = () => {
        setStep(1);
        setInputs({ totalEstate: '', assetRelatedDebt: 0, nonAssetRelatedDebt: 0, funeralExpenses: 0, bequest: 0 });
        setHeirs({});
        setErrors({});
        setWarnings({});
        setResults(null);
    }
    
    const handleCalculate = () => {
        let bequest = Number(inputs.bequest) || 0;
        if (bequest > inputs.totalEstate / 3) {
            bequest = inputs.totalEstate / 3;
        }
        const liabilities = (Number(inputs.assetRelatedDebt) || 0) + (Number(inputs.nonAssetRelatedDebt) || 0) + (Number(inputs.funeralExpenses) || 0);
        const netEstate = Math.max(0, inputs.totalEstate - liabilities - bequest);
        
        const calculationResults = faroidh.calculate(netEstate, heirs);
        setResults({ ...calculationResults, inputs, netEstate, liabilities, bequest });
    };

    const blockedHeirs = useMemo(() => faroidh.getBlockedHeirs(heirs), [heirs]);
    const formatCurrency = (val: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    const inputClass = "w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500 disabled:opacity-50";
    const labelClass = "flex items-center text-sm font-semibold text-slate-600 dark:text-brand-muted";
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = isRechartsLoaded ? Recharts : ({} as any);

    const STEPS = [ { id: 1, title: t('step1') }, { id: 2, title: t('step2') }, { id: 3, title: t('step3') }, { id: 4, title: t('step4') } ];
    
    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <strong className="flex items-center gap-2 text-lg">⚖️ {t('inheritanceCalculator')}</strong>
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => <div key={s.id} className={`flex items-center gap-2 ${s.id > step ? 'opacity-50' : ''}`}>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${s.id === step ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-brand-card'}`}>{s.id}</span>
                            <span className="hidden sm:inline">{s.title}</span>
                            {i < STEPS.length - 1 && <div className="hidden h-px w-8 bg-slate-300 dark:bg-brand-line sm:block" />}
                        </div>)}
                    </div>
                </div>

                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>

                <div className="min-h-[400px]">
                    {step === 1 && <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('totalEstate')}</h3>
                        <div>
                            <label className={labelClass}>{t('totalEstate')}</label>
                            <input type="number" name="totalEstate" value={inputs.totalEstate} onChange={handleInputChange} placeholder="Rp" className={inputClass} />
                            {errors.totalEstate && <p className="mt-1 text-sm text-red-500">{errors.totalEstate}</p>}
                        </div>
                    </div>}

                    {step === 2 && <div className="space-y-4">
                         <h3 className="text-xl font-bold">{t('estateLiabilities')}</h3>
                         <div><label className={labelClass}>{t('assetRelatedDebt')}</label><input type="number" name="assetRelatedDebt" value={inputs.assetRelatedDebt} onChange={handleInputChange} placeholder="Rp" className={inputClass} />{errors.assetRelatedDebt && <p className="mt-1 text-sm text-red-500">{errors.assetRelatedDebt}</p>}</div>
                         <div><label className={labelClass}>{t('nonAssetRelatedDebt')}</label><input type="number" name="nonAssetRelatedDebt" value={inputs.nonAssetRelatedDebt} onChange={handleInputChange} placeholder="Rp" className={inputClass} />{errors.nonAssetRelatedDebt && <p className="mt-1 text-sm text-red-500">{errors.nonAssetRelatedDebt}</p>}</div>
                         <div><label className={labelClass}>{t('funeralExpenses')}</label><input type="number" name="funeralExpenses" value={inputs.funeralExpenses} onChange={handleInputChange} placeholder="Rp" className={inputClass} />{errors.funeralExpenses && <p className="mt-1 text-sm text-red-500">{errors.funeralExpenses}</p>}</div>
                         <div><label className={labelClass}>{t('bequest')}</label><input type="number" name="bequest" value={inputs.bequest} onChange={handleInputChange} placeholder="Rp" className={inputClass} />{errors.bequest && <p className="mt-1 text-sm text-red-500">{errors.bequest}</p>}{warnings.bequest && <p className="mt-1 text-sm text-amber-600">{warnings.bequest}</p>}</div>
                         {errors.total && <p className="mt-2 text-center font-bold text-red-500">{errors.total}</p>}
                    </div>}

                    {step === 3 && <div className="space-y-4">
                         <h3 className="text-xl font-bold">{t('heirs')}</h3>
                         <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                            {heirList.map(h => <div key={h.id}>
                                <label className={`${labelClass} ${blockedHeirs.has(h.id) ? 'text-slate-400 line-through' : ''}`}>{t(h.id)}</label>
                                <input type="number" min="0" step="1" value={heirs[h.id] || ''} onChange={e => handleHeirChange(h.id, e.target.value)} disabled={blockedHeirs.has(h.id)} placeholder="0" className={inputClass} />
                                {errors[h.id] && <p className="mt-1 text-sm text-red-500">{errors[h.id]}</p>}
                            </div>)}
                         </div>
                    </div>}
                    
                    {step === 4 && results && <div className="space-y-6">
                        <h3 className="text-xl font-bold">{t('results')}</h3>
                        {results.errors.length > 0 && <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-red-500">{results.errors.map((e:string, i:number) => <p key={i}>{t(e)}</p>)}</div>}
                        {results.warnings.length > 0 && <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600">{results.warnings.map((w:any, i:number) => <p key={i}>{t(w.key, { amount: formatCurrency(w.amount) })}</p>)}</div>}
                        
                        <div className="rounded-lg border border-slate-200 dark:border-brand-line p-4">
                           <h4 className="font-bold text-lg mb-2">{t('summary')}</h4>
                           <div className="grid grid-cols-2 gap-2 text-sm">
                                <span>{t('totalEstate')}</span><span className="text-right font-mono">{formatCurrency(results.inputs.totalEstate)}</span>
                                <span>(-) {t('totalLiabilities')}</span><span className="text-right font-mono">{formatCurrency(results.liabilities + results.bequest)}</span>
                                <hr className="col-span-2 border-slate-300 dark:border-brand-line"/>
                                <span className="font-bold">{t('netEstate')}</span><span className="text-right font-bold font-mono">{formatCurrency(results.netEstate)}</span>
                           </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-brand-line">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-brand-card"><tr className="whitespace-nowrap"><th className="p-3 font-semibold">{t('heir')}</th><th className="p-3 font-semibold">{t('share')}</th><th className="p-3 font-semibold text-right">{t('amount')}</th></tr></thead>
                                <tbody>
                                    {results.distribution.length > 0 ? results.distribution.map((d: any) => <tr key={d.heir} className="border-t border-slate-200 dark:border-brand-line">
                                        <td className="p-3 font-semibold">{d.name} ({d.count})</td>
                                        <td className="p-3">{d.reason} ({d.shareText})</td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(d.amount)}</td>
                                    </tr>) : <tr><td colSpan={3} className="p-8 text-center text-slate-500">{t('error_noValidHeirs')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {isRechartsLoaded && results.distribution.length > 0 && <div className="h-80 w-full">
                             <h4 className="font-bold text-lg mb-2">{t('distributionChart')}</h4>
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={results.distribution} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {results.distribution.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={faroidh.CHART_COLORS[index % faroidh.CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [formatCurrency(value), t('amount')]} contentStyle={{backgroundColor: theme==='dark' ? '#0f172a' : '#fff', border: `1px solid ${theme==='dark' ? '#1f2937' : '#e2e8f0'}`}} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>}
                    </div>}
                </div>
                
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                <div className="flex items-center gap-2">
                    {step > 1 && <Button onClick={handleBack}>{t('prevStep')}</Button>}
                    <Button onClick={handleReset} className="border-red-300 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-500/50 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30">
                        {t('reset')}
                    </Button>
                    <div className="flex-grow"></div>
                    {step < 3 && <Button onClick={handleNext} className="bg-sky-500 text-white hover:bg-sky-600">{t('nextStep')}</Button>}
                    {step === 3 && <Button onClick={handleNext} className="bg-green-500 text-white hover:bg-green-600">{t('calculateInheritance')}</Button>}
                </div>
            </div>
        </section>
    );
};