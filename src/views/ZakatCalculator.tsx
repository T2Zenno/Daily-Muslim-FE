import React, { useState, useMemo } from 'react';
import { Language } from '../lib/types';
import { Button, Icon, Badge, Pill } from '../lib/ui';

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <span className="group relative ml-1">
        <Icon className="cursor-help text-sky-500">ℹ️</Icon>
        <span className="absolute bottom-full mb-2 w-64 -translate-x-1/2 left-1/2 scale-0 transform rounded bg-slate-800 p-2 text-xs text-white transition-all group-hover:scale-100 dark:bg-slate-700">
            {text}
        </span>
    </span>
);

export const ZakatCalculator: React.FC<{ t: (k: string) => string; lang: Language; }> = ({ t, lang }) => {
    const [zakatType, setZakatType] = useState('fitrah');
    const [inputs, setInputs] = useState<any>({
        fitrah_people: 1,
        fitrah_price: 15000,
        gold_price: 0,
        irrigation: 'paid',
        livestock_type: 'goat',
    });
    const [result, setResult] = useState<string | null>(null);

    const inputClass = "w-full rounded-md border border-slate-300 dark:border-brand-line bg-slate-50 dark:bg-brand-card p-2 outline-none focus:border-sky-500";
    const labelClass = "flex items-center text-sm font-semibold text-slate-600 dark:text-brand-muted";

    const formatCurrency = (value: number) => new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: lang === 'id' ? 'IDR' : 'USD', minimumFractionDigits: 0 }).format(value);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setResult(null); // Reset result on input change
        setInputs((prev: any) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const calculateZakat = () => {
        const nisab = (inputs.gold_price || 0) * 85;

        switch (zakatType) {
            case 'fitrah': {
                const totalKg = (inputs.fitrah_people || 0) * 2.5;
                const totalValue = totalKg * (inputs.fitrah_price || 0);
                setResult(`${t('totalZakatFitrah')}: ${formatCurrency(totalValue)} ${t('or')} ${totalKg} ${t('kgOfRice')}`);
                break;
            }
            case 'mal': {
                if (!inputs.gold_price) { setResult(t('enterGoldPrice')); return; }
                const wealth = inputs.mal_wealth || 0;
                if (wealth < nisab) {
                    setResult(`${t('zakatNotDue')}. ${t('belowNisab')}\n(${t('nisabValue')}: ${formatCurrency(nisab)})`);
                } else {
                    const zakatAmount = wealth * 0.025;
                    setResult(`${t('zakatAmount')}: ${formatCurrency(zakatAmount)}\n(${t('nisabValue')}: ${formatCurrency(nisab)})`);
                }
                break;
            }
            case 'income': {
                 if (!inputs.gold_price) { setResult(t('enterGoldPrice')); return; }
                const monthlyNisab = nisab / 12;
                const netIncome = (inputs.income_monthly || 0) - (inputs.income_expenses || 0);
                if (netIncome < monthlyNisab) {
                    setResult(`${t('zakatNotDue')}. Pendapatan bersih Anda di bawah nisab bulanan.\n(Nisab Bulanan: ${formatCurrency(monthlyNisab)})`);
                } else {
                    const zakatAmount = netIncome * 0.025;
                    setResult(`${t('zakatAmount')}: ${formatCurrency(zakatAmount)} / bulan\n(Nisab Bulanan: ${formatCurrency(monthlyNisab)})`);
                }
                break;
            }
            case 'agriculture': {
                const nisabKg = 520; // Beras
                const harvest = inputs.agri_harvest || 0;
                if (harvest < nisabKg) {
                     setResult(`${t('zakatNotDue')}. Hasil panen di bawah nisab (${nisabKg} kg).`);
                } else {
                    const rate = inputs.irrigation === 'paid' ? 0.05 : 0.10;
                    const zakatKg = harvest * rate;
                    const zakatValue = zakatKg * (inputs.agri_price_kg || 0);
                    setResult(`${t('zakatAmount')}: ${zakatKg.toFixed(2)} kg (${formatCurrency(zakatValue)})`);
                }
                break;
            }
            case 'trade': {
                if (!inputs.gold_price) { setResult(t('enterGoldPrice')); return; }
                const netAssets = (inputs.trade_assets || 0) + (inputs.trade_capital || 0) + (inputs.trade_receivables || 0) - (inputs.trade_debt || 0);
                if (netAssets < nisab) {
                    setResult(`${t('zakatNotDue')}. ${t('belowNisab')}\n(${t('nisabValue')}: ${formatCurrency(nisab)})`);
                } else {
                    const zakatAmount = netAssets * 0.025;
                    setResult(`${t('zakatAmount')}: ${formatCurrency(zakatAmount)}\n(Total Harta Bersih: ${formatCurrency(netAssets)})`);
                }
                break;
            }
             case 'livestock': {
                const count = inputs.livestock_count || 0;
                let zakatDesc = '';
                switch (inputs.livestock_type) {
                    case 'goat':
                        if (count < 40) zakatDesc = t('zakatNotDue');
                        else if (count <= 120) zakatDesc = '1 ekor kambing (≥ 2 thn) / domba (≥ 1 thn)';
                        else if (count <= 200) zakatDesc = '2 ekor kambing/domba';
                        else if (count <= 399) zakatDesc = '3 ekor kambing/domba';
                        else zakatDesc = `${Math.floor(count / 100)} ekor kambing/domba`;
                        break;
                    case 'cow':
                        if (count < 30) zakatDesc = t('zakatNotDue');
                        else if (count <= 39) zakatDesc = '1 ekor sapi Tabi\' (jantan/betina 1 thn)';
                        else if (count <= 59) zakatDesc = '1 ekor sapi Musinnah (betina 2 thn)';
                        else if (count <= 69) zakatDesc = '2 ekor sapi Tabi\'';
                        else if (count <= 79) zakatDesc = '1 Tabi\' dan 1 Musinnah';
                        else if (count <= 89) zakatDesc = '2 ekor sapi Musinnah';
                        else if (count <= 99) zakatDesc = '3 ekor sapi Tabi\'';
                        else {
                            const musinnah = Math.floor(count / 40);
                            const tabi = Math.floor((count % 40) / 30);
                            zakatDesc = `${musinnah} Musinnah & ${tabi} Tabi' (jika memungkinkan, jika tidak ${Math.floor(count / 30)} Tabi')`;
                        }
                        break;
                    case 'camel':
                        if (count < 5) zakatDesc = t('zakatNotDue');
                        else if (count <= 9) zakatDesc = '1 ekor kambing';
                        else if (count <= 14) zakatDesc = '2 ekor kambing';
                        else if (count <= 19) zakatDesc = '3 ekor kambing';
                        else if (count <= 24) zakatDesc = '4 ekor kambing';
                        else if (count <= 35) zakatDesc = '1 Bintu Makhad (unta betina 1 thn)';
                        else if (count <= 45) zakatDesc = '1 Bintu Labun (unta betina 2 thn)';
                        else if (count <= 60) zakatDesc = '1 Hiqqah (unta betina 3 thn)';
                        else if (count <= 75) zakatDesc = '1 Jadza\'ah (unta betina 4 thn)';
                        else if (count <= 90) zakatDesc = '2 Bintu Labun';
                        else if (count <= 120) zakatDesc = '2 Hiqqah';
                        else zakatDesc = `${Math.floor(count/50)} Hiqqah dan ${Math.floor((count % 50)/40)} Bintu Labun`;
                        break;
                }
                setResult(`${t('zakatDue')}: ${zakatDesc}`);
                break;
            }
        }
    };
    
    const ZAKAT_TYPES = [
        { id: 'fitrah', labelKey: 'zakatFitrah' }, { id: 'mal', labelKey: 'zakatMal' },
        { id: 'income', labelKey: 'zakatIncome' }, { id: 'agriculture', labelKey: 'zakatAgriculture' },
        { id: 'trade', labelKey: 'zakatTrade' }, { id: 'livestock', labelKey: 'zakatLivestock' }
    ];

    const needsGoldPrice = ['mal', 'income', 'trade'].includes(zakatType);

    const renderForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zakatType === 'fitrah' && <>
                <div><label className={labelClass}>{t('numberOfPeople')}</label><input type="number" min="1" name="fitrah_people" value={inputs.fitrah_people || 1} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className={labelClass}>{t('ricePricePerKg')}</label><input type="number" min="0" name="fitrah_price" value={inputs.fitrah_price || ''} onChange={handleInputChange} placeholder="cth: 15000" className={inputClass} /></div>
            </>}
            {zakatType === 'mal' && <div><label className={labelClass}>{t('totalWealth')}</label><input type="number" min="0" name="mal_wealth" value={inputs.mal_wealth || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>}
            {zakatType === 'income' && <>
                <div><label className={labelClass}>{t('monthlyIncome')}</label><input type="number" min="0" name="income_monthly" value={inputs.income_monthly || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
                <div><label className={labelClass}>{t('monthlyExpenses')}</label><input type="number" min="0" name="income_expenses" value={inputs.income_expenses || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
            </>}
            {zakatType === 'agriculture' && <>
                <div><label className={labelClass}>{t('harvestResultKg')}</label><input type="number" min="0" name="agri_harvest" value={inputs.agri_harvest || ''} onChange={handleInputChange} className={inputClass} placeholder="kg" /></div>
                <div><label className={labelClass}>{t('pricePerKg')}</label><input type="number" min="0" name="agri_price_kg" value={inputs.agri_price_kg || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
                <div className="md:col-span-2"><label className={labelClass}>{t('irrigationType')}</label><select name="irrigation" value={inputs.irrigation || 'paid'} onChange={handleInputChange} className={inputClass}><option value="paid">{t('paidIrrigation')}</option><option value="rain">{t('rainFed')}</option></select></div>
            </>}
            {zakatType === 'trade' && <>
                <div><label className={labelClass}>{t('tradeAssets')}</label><input type="number" min="0" name="trade_assets" value={inputs.trade_assets || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
                <div><label className={labelClass}>{t('workingCapital')}</label><input type="number" min="0" name="trade_capital" value={inputs.trade_capital || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
                <div><label className={labelClass}>{t('receivables')}</label><input type="number" min="0" name="trade_receivables" value={inputs.trade_receivables || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
                <div><label className={labelClass}>{t('shortTermDebt')}</label><input type="number" min="0" name="trade_debt" value={inputs.trade_debt || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" /></div>
            </>}
            {zakatType === 'livestock' && <>
                <div><label className={labelClass}>{t('livestockType')}</label><select name="livestock_type" value={inputs.livestock_type || 'goat'} onChange={handleInputChange} className={inputClass}><option value="goat">{t('goat')}</option><option value="cow">{t('cow')}</option><option value="camel">{t('camel')}</option></select></div>
                <div><label className={labelClass}>{t('numberOfAnimals')}</label><input type="number" min="0" name="livestock_count" value={inputs.livestock_count || ''} onChange={handleInputChange} className={inputClass} placeholder="Ekor" /></div>
            </>}
            {needsGoldPrice && <div className="md:col-span-2">
                <label className={labelClass}>
                    {t('goldPricePerGram')}
                    <InfoTooltip text={zakatType === 'income' ? t('nisabIncomeInfo') : t('nisabInfo')} />
                </label>
                <input type="number" min="0" name="gold_price" value={inputs.gold_price || ''} onChange={handleInputChange} className={inputClass} placeholder="Rp" required />
            </div>}
        </div>
    );
    
    return (
        <section className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-brand-line bg-white dark:bg-brand-panel p-4">
                <strong className="flex items-center gap-2 text-lg">💸 {t('zakatCalculator')}</strong>
                <div className="my-3 h-px bg-slate-200 dark:bg-brand-line"></div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="zakat-type" className={labelClass}>{t('zakatType')}</label>
                        <select id="zakat-type" value={zakatType} onChange={e => { setZakatType(e.target.value); setResult(null); }} className={`${inputClass} mt-1`}>
                           {ZAKAT_TYPES.map(type => <option key={type.id} value={type.id}>{t(type.labelKey)}</option>)}
                        </select>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-brand-line p-4">
                        {renderForm()}
                    </div>
                </div>

                <Button onClick={calculateZakat} className="w-full justify-center bg-sky-500 text-white font-bold hover:bg-sky-600 border-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 dark:border-sky-700">
                    {t('calculate')}
                </Button>

                {result && (
                    <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-center dark:border-green-500/50 dark:bg-green-500/10">
                        <h3 className="font-bold text-green-800 dark:text-green-300">{t('result')}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-lg font-semibold text-green-900 dark:text-green-200">{result}</p>
                    </div>
                )}
            </div>
        </section>
    );
};
