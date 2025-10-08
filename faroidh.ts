// A simplified implementation of Faraidh (Islamic Inheritance) rules.
// This covers common cases but may not handle all complex scenarios or differences of opinion among fiqh schools.
// For official legal purposes, consultation with a qualified scholar is necessary.

type Heirs = { [key: string]: number };

interface CalculationResult {
    distribution: any[];
    errors: string[];
    warnings: { key: string; amount: number }[];
    blocked: string[];
}

const HEIR_LIST = [
    { id: 'husband', group: 'spouse' },
    { id: 'wife', group: 'spouse' },
    { id: 'son', group: 'descendants' },
    { id: 'daughter', group: 'descendants' },
    { id: 'father', group: 'ascendants' },
    { id: 'mother', group: 'ascendants' },
    { id: 'grandson_from_son', group: 'descendants' },
    { id: 'granddaughter_from_son', group: 'descendants' },
    { id: 'paternal_grandfather', group: 'ascendants' },
    { id: 'paternal_grandmother', group: 'ascendants' },
    { id: 'maternal_grandmother', group: 'ascendants' },
    { id: 'full_brother', group: 'collaterals' },
    { id: 'full_sister', group: 'collaterals' },
    { id: 'paternal_brother', group: 'collaterals' },
    { id: 'paternal_sister', group: 'collaterals' },
    { id: 'maternal_brother', group: 'collaterals' },
    { id: 'maternal_sister', group: 'collaterals' },
    { id: 'full_nephew', group: 'collaterals' },
    { id: 'paternal_nephew', group: 'collaterals' },
    { id: 'full_paternal_uncle', group: 'collaterals' },
    { id: 'paternal_uncle', group: 'collaterals' },
    { id: 'full_paternal_cousin', group: 'collaterals' },
    { id: 'paternal_cousin', group: 'collaterals' },
    { id: 'male_emancipator', group: 'emancipator' },
    { id: 'female_emancipator', group: 'emancipator' }
];

// Hajb (Blocking) rules. Key is the blocker, value is an array of heirs they block.
const HAJB_RULES: { [key: string]: string[] } = {
    son: ['grandson_from_son', 'granddaughter_from_son', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister', 'maternal_brother', 'maternal_sister', 'full_nephew', 'paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    father: ['paternal_grandfather', 'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister', 'maternal_brother', 'maternal_sister', 'full_nephew', 'paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    paternal_grandfather: ['full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    grandson_from_son: ['full_nephew', 'paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    full_brother: ['paternal_brother', 'paternal_sister', 'full_nephew', 'paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    paternal_brother: ['paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    full_nephew: ['paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    paternal_nephew: ['full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    full_paternal_uncle: ['paternal_uncle', 'full_paternal_cousin', 'paternal_cousin'],
    paternal_uncle: ['full_paternal_cousin', 'paternal_cousin'],
};

// Asabah (Residuary) priority order.
const ASABAH_PRIORITY = ['son', 'grandson_from_son', 'father', 'paternal_grandfather', 'full_brother', 'paternal_brother', 'full_nephew', 'paternal_nephew', 'full_paternal_uncle', 'paternal_uncle', 'full_paternal_cousin', 'paternal_cousin', 'male_emancipator', 'female_emancipator'];

const getBlockedHeirs = (h: Heirs): Set<string> => {
    const blocked = new Set<string>();
    const activeHeirs = Object.keys(h).filter(key => h[key] > 0);

    for (const blocker of activeHeirs) {
        if (HAJB_RULES[blocker]) {
            for (const blockedHeir of HAJB_RULES[blocker]) {
                blocked.add(blockedHeir);
            }
        }
    }
    // Specific blocking rules
    if (activeHeirs.includes('father')) blocked.add('paternal_grandfather');
    if (activeHeirs.includes('mother')) {
        blocked.add('paternal_grandmother');
        blocked.add('maternal_grandmother');
    }
    if (activeHeirs.includes('paternal_grandfather')) {
        blocked.add('paternal_grandmother');
    }
    if (activeHeirs.includes('daughter') && h.daughter >= 2 && !activeHeirs.includes('son')) {
        blocked.add('granddaughter_from_son');
    }

    return blocked;
}

const calculate = (netEstate: number, inputHeirs: Heirs): CalculationResult => {
    const shares: { [key: string]: { share: number, text: string, reason: string } } = {};
    const asabah: { [key: string]: { ratio: number, reason: string } } = {};
    const result: CalculationResult = { distribution: [], errors: [], warnings: [], blocked: [] };
    
    // Create a working copy of heirs with only those present
    const h: Heirs = {};
    for (const key in inputHeirs) {
        if (inputHeirs[key] > 0) h[key] = inputHeirs[key];
    }

    // Spouse constraints
    if (h.husband > 0 && h.wife > 0) { result.errors.push('Cannot have both husband and wife'); return result; }
    if (h.husband > 1) { result.errors.push('Cannot have more than one husband'); return result; }
    if (h.wife > 4) { result.errors.push('Cannot have more than four wives'); return result; }
    
    // Determine blocked heirs
    const blockedSet = getBlockedHeirs(h);
    result.blocked = Array.from(blockedSet);
    for (const blocked of result.blocked) {
        delete h[blocked];
    }
    
    if (Object.keys(h).length === 0) {
        result.errors.push('error_noValidHeirs');
        return result;
    }

    const hasDescendant = h.son > 0 || h.daughter > 0 || h.grandson_from_son > 0 || h.granddaughter_from_son > 0;
    const hasMultipleSiblings = (h.full_brother || 0) + (h.full_sister || 0) + (h.paternal_brother || 0) + (h.paternal_sister || 0) + (h.maternal_brother || 0) + (h.maternal_sister || 0) >= 2;

    // --- Ashabul Furudh (Fixed Sharers) ---
    // Husband
    if (h.husband > 0) shares.husband = { share: hasDescendant ? 1/4 : 1/2, text: hasDescendant ? '1/4' : '1/2', reason: 'Furudh' };
    // Wife
    if (h.wife > 0) shares.wife = { share: hasDescendant ? 1/8 : 1/4, text: hasDescendant ? '1/8' : '1/4', reason: 'Furudh' };
    // Mother
    if (h.mother > 0) {
        let motherShare = 1/3;
        if (hasDescendant || hasMultipleSiblings) motherShare = 1/6;
        // Umariyyatayn cases
        const isUmari = (h.husband > 0 || h.wife > 0) && h.father > 0 && Object.keys(h).length === 3;
        if(isUmari) { motherShare = -1/3; } // Special case: 1/3 of remainder
        shares.mother = { share: motherShare, text: motherShare === 1/6 ? '1/6' : '1/3', reason: 'Furudh' };
    }
    // Father
    if (h.father > 0) {
        if (h.son > 0 || h.grandson_from_son > 0) {
            shares.father = { share: 1/6, text: '1/6', reason: 'Furudh' };
        } else {
            if (h.daughter > 0 || h.granddaughter_from_son > 0) {
                shares.father = { share: 1/6, text: '1/6', reason: 'Furudh' };
            }
            asabah.father = { ratio: 1, reason: 'Asabah' };
        }
    }
    // Paternal Grandfather (if not blocked)
    if (h.paternal_grandfather > 0) {
        if (h.son > 0 || h.grandson_from_son > 0) {
            shares.paternal_grandfather = { share: 1/6, text: '1/6', reason: 'Furudh' };
        } else {
            asabah.paternal_grandfather = { ratio: 1, reason: 'Asabah' };
        }
    }
    // Maternal Siblings
    if (h.maternal_brother > 0 || h.maternal_sister > 0) {
        const count = (h.maternal_brother || 0) + (h.maternal_sister || 0);
        shares.maternal_siblings = { share: count === 1 ? 1/6 : 1/3, text: count === 1 ? '1/6' : '1/3', reason: 'Furudh' };
    }

    // --- Asabah & Furudh based on context ---
    if (h.son > 0) {
        asabah.son = { ratio: 2, reason: 'Asabah' };
        if (h.daughter > 0) asabah.daughter = { ratio: 1, reason: 'Asabah' };
    } else {
        if (h.daughter > 0) {
            if (h.daughter === 1) shares.daughter = { share: 1/2, text: '1/2', reason: 'Furudh' };
            else shares.daughter = { share: 2/3, text: '2/3', reason: 'Furudh' };
        }
    }
    // Full logic for sisters becoming asabah with daughters etc. is complex and omitted for simplification.
    
    // Distribute shares
    let totalShare = 0;
    const umariMother = shares.mother?.share === -1/3;
    let remainder = 1;
    
    if (umariMother) {
        if(shares.husband) remainder -= shares.husband.share;
        if(shares.wife) remainder -= shares.wife.share;
        shares.mother.share = remainder / 3;
    }

    for (const key in shares) totalShare += shares[key].share;
    
    remainder = 1 - totalShare;

    if (remainder > 0 && Object.keys(asabah).length > 0) {
        let totalRatio = 0;
        for (const key in asabah) totalRatio += asabah[key].ratio * (h[key] || 0);
        for (const key in asabah) {
            const asabahShare = (asabah[key].ratio * (h[key] || 0) / totalRatio) * remainder;
            shares[key] = { share: asabahShare, text: `Sisa`, reason: asabah[key].reason };
        }
        totalShare = 1;
    }
    
    // Aul (Increase) & Radd (Return) are complex and not fully implemented here for simplicity.
    
    // Final distribution
    let totalDistributed = 0;
    for (const key in shares) {
         let count = h[key] || 0;
         if (key === 'maternal_siblings') count = (h.maternal_brother || 0) + (h.maternal_sister || 0);

         const amount = shares[key].share * netEstate / (totalShare > 1 ? totalShare : 1); // Basic Aul
         result.distribution.push({
             heir: key, name: key, count,
             shareText: shares[key].text,
             reason: shares[key].reason,
             amount
         });
         totalDistributed += amount;
    }
    
    const leftover = netEstate - totalDistributed;
    if (Math.abs(leftover) > 1) { // Allow for small rounding errors
         result.warnings.push({ key: 'warning_rounding', amount: leftover });
    }

    return result;
}

const getHeirList = () => HEIR_LIST;

export const faroidh = {
    calculate,
    getHeirList,
    getBlockedHeirs,
    CHART_COLORS: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#22d3ee', '#a3e635']
};
