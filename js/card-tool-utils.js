export const BASE_SOURCE_CODES = new Set(["PHB", "XGE", "TCE"]);

export const CARD_FIT = {
	title: {
		defaultPt: 14,
		singleLineMinPt: 10.5,
		wrapStartPt: 11,
		wrapMinPt: 9,
		stepPt: 0.25,
	},
	backTitle: {
		defaultPt: 16,
		singleLineMinPt: 11.25,
		wrapStartPt: 15,
		wrapMinPt: 9.75,
		stepPt: 0.25,
	},
	description: {
		defaultPt: 9.8,
		minPt: 8.9,
		stepPt: 0.15,
		defaultLineHeight: 1.3,
		minLineHeight: 1.2,
		defaultParaMm: 2.6,
		minParaMm: 1.6,
	},
};

export function getFilterValues (entities, group) {
	return [...new Set(entities.flatMap(entity => group.values(entity)))].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
}

export function getBaseSourceValues (values, baseSources = BASE_SOURCE_CODES) {
	const allowed = baseSources instanceof Set ? baseSources : new Set(baseSources);
	return values.filter(value => allowed.has(value));
}

export function passesFilterGroup (entityValues, activeValues, isCleared = false) {
	if (isCleared) return false;
	if (!activeValues.length) return true;
	return activeValues.some(value => entityValues.map(String).includes(value));
}

globalThis.CardToolUtils = {BASE_SOURCE_CODES, CARD_FIT, getFilterValues, getBaseSourceValues, passesFilterGroup};