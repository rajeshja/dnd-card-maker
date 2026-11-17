import {flattenCardEntries} from "./card-tool-text.js";
import {shrinkFloor, textFlow} from "./card-tool-flow.js";

export const ELLIPSIS_HTML = `<span class="card-ellipsis">…</span>`;

export const SCHOOLS = {A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation"};

export const DEFAULT_FIT = Object.freeze({
	defaultPt: 9.8,
	minPt: 8.9,
	stepPt: 0.15,
	defaultLineHeight: 1.3,
	minLineHeight: 1.2,
});

export const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"}[char]));

const fitFor = fit => fit ?? globalThis.CardToolUtils?.CARD_FIT?.description ?? DEFAULT_FIT;

export function spellOrdinal (level) {
	return level === 0 ? "Cantrip" : `${["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"][level]}-level`;
}

const sortedUnique = values => [...new Set(values)].sort((left, right) => left.localeCompare(right));

// A generated spell lookup entry holds base classes under `class`/`classVariant` and subclass
// grants under `subclass`; both are keyed by owning class and edition. Base classes win, and
// edition twins collapse into one short subclass name per owning class.
export function resolveSpellClasses (entry) {
	const baseNames = [];
	for (const group of [entry?.class, entry?.classVariant]) {
		for (const edition of Object.values(group || {})) baseNames.push(...Object.keys(edition || {}));
	}
	const grantsByClass = new Map();
	for (const edition of Object.values(entry?.subclass || {})) {
		for (const [className, subclassSources] of Object.entries(edition || {})) {
			if (!grantsByClass.has(className)) grantsByClass.set(className, []);
			for (const subclasses of Object.values(subclassSources || {})) grantsByClass.get(className).push(...Object.keys(subclasses || {}));
		}
	}
	const grants = [...grantsByClass.entries()]
		.map(([className, subclasses]) => ({className, subclasses: sortedUnique(subclasses)}))
		.sort((left, right) => left.className.localeCompare(right.className));
	return {classes: sortedUnique(baseNames), grants};
}

export function spellClassLabel (entry) {
	const {classes, grants} = resolveSpellClasses(entry);
	const entries = classes.length ? classes : grants.map(grant => grant.className);
	const text = classes.length
		? classes.join(", ")
		: grants.map(grant => `${grant.className} (${grant.subclasses.join(", ")})`).join(", ") || "—";
	return {text, singular: entries.length === 1};
}

export function spellTime (spell) {
	return spell.time?.[0] ? `${spell.time[0].number} ${spell.time[0].unit}` : "—";
}

export function spellRange (spell) {
	return spell.range?.type === "point" ? spell.range.distance?.type || "—" : spell.range?.type || "—";
}

export function spellDuration (spell) {
	const duration = spell.duration?.[0];
	if (duration?.type !== "timed") return duration?.type || "—";
	return `${duration.duration.amount} ${duration.duration.type}`;
}

export function spellComponents (spell) {
	return [spell.components?.v && "V", spell.components?.s && "S", spell.components?.m && "M"].filter(Boolean).join(" ") || "—";
}

export function spellIndicators (spell) {
	const concentration = spell.duration?.[0]?.concentration;
	const ritual = spell.meta?.ritual;
	if (!concentration && !ritual) return "";
	return `<span class="spell-title-indicator">${concentration ? "◉" : ""}${ritual ? " ✧" : ""}</span>`;
}

export function spellMetaHtml (spell) {
	return `<div class="spell-meta"><div class="spell-meta-row"><strong>${escapeText(spellOrdinal(spell.level))}</strong> · ${escapeText(spellTime(spell))} · ${escapeText(spellRange(spell))}</div><div class="spell-meta-row">${escapeText(spellDuration(spell))} · ${escapeText(spellComponents(spell))}</div></div>`;
}

export function itemMetaHtml (item) {
	return escapeText([item.type, item.rarity, item.source].filter(Boolean).join(" · "));
}

export function spellText (entries) {
	return (entries || []).map(entry => {
		if (typeof entry === "string") return entry.replace(/\{@\w+ ([^}|]+)(?:\|[^}]*)?\}/g, "$1");
		if (entry.type === "table") return "[Table]";
		if (entry.items) return spellText(entry.items);
		if (entry.entries) return `${entry.name ? `${entry.name}: ` : ""}${spellText(entry.entries)}`;
		return "";
	}).filter(Boolean).join(" ");
}

export function sentenceUnits (text, startBlock = 0) {
	return String(text ?? "").split(/(?<=[.!?])\s+/)
		.map(sentence => sentence.trim())
		.filter(Boolean)
		.map((sentence, index) => ({block: startBlock + index, kind: "text", text: sentence}));
}

export function wordUnits (unit) {
	return String(unit.text ?? "").split(/\s+/).filter(Boolean).map(text => ({...unit, text}));
}

export function spellUnits (spell) {
	const units = sentenceUnits(spellText(spell.entries));
	const material = typeof spell.components?.m === "string" ? spell.components.m : spell.components?.m?.text;
	if (material) units.push({block: units.length, kind: "material", text: material});
	return units;
}

export function itemUnits (item) {
	return sentenceUnits(flattenCardEntries(item.entries));
}

export function renderUnits (units, {ellipsis = false} = {}) {
	const blocks = [];
	for (const unit of units) {
		if (unit.kind === "material") {
			blocks.push({kind: "material", text: unit.text, parts: [unit.text], marker: false});
			continue;
		}
		let block = blocks[blocks.length - 1];
		if (!block || block.kind !== "text" || block.block !== unit.block) {
			block = {kind: "text", block: unit.block, parts: [], marker: false};
			blocks.push(block);
		}
		block.parts.push(unit.text);
	}
	if (ellipsis) {
		if (!blocks.length) blocks.push({kind: "text", parts: [], marker: true});
		else blocks[blocks.length - 1].marker = true;
	}
	return blocks.map(block => {
		const marker = block.marker ? ELLIPSIS_HTML : "";
		const text = escapeText(block.parts.join(" "));
		if (block.kind === "material") return `<div class="material-component"><strong>M:</strong> ${text}${marker}</div>`;
		return `<p>${text}${marker}</p>`;
	}).join("");
}

export function lineHeightFor (fontPt, defaultPt, floorPt, defaultLineHeight = 1.3, minLineHeight = 1.2) {
	if (fontPt >= defaultPt) return defaultLineHeight;
	if (fontPt <= floorPt) return minLineHeight;
	const progress = (defaultPt - fontPt) / Math.max(0.0001, defaultPt - floorPt);
	return Number((defaultLineHeight - (defaultLineHeight - minLineHeight) * progress).toFixed(3));
}

export function spellPanel (spell, units, {continuation = false, ellipsis = false, fontPt = 9.8, title = "", indicatorsHtml = "", metaHtml = "", lineHeight = 1.3} = {}) {
	const suffix = continuation ? `<span class="spell-title-indicator">contd.</span>` : indicatorsHtml;
	const meta = continuation ? "" : metaHtml;
	const metaBlock = meta ? `${meta}<hr class="spell-divider">` : "";
	return `<div class="card-inner school-${escapeText(spell.school || "")}" data-content-pt="${fontPt}"><article class="entity-card spell-card"><h1 class="entity-title spell-title">${title}${suffix}</h1><hr class="spell-divider">${metaBlock}<div class="entity-body spell-description" style="font-size:${fontPt}pt;line-height:${lineHeight}">${renderUnits(units, {ellipsis})}</div></article></div>`;
}

export function itemPanel (item, units, {continuation = false, ellipsis = false, fontPt = 9.8, title = "", metaHtml = "", lineHeight = 1.3} = {}) {
	const suffix = continuation ? ` <span class="item-title-suffix">(contd.)</span>` : "";
	const meta = continuation ? "" : `<div class="entity-meta">${metaHtml}</div>`;
	return `<div class="card-inner" data-content-pt="${fontPt}"><article class="entity-card"><h1 class="entity-title">${title}${suffix}</h1><hr class="entity-rule">${meta}<div class="entity-body" style="font-size:${fontPt}pt;line-height:${lineHeight}">${renderUnits(units, {ellipsis})}</div></article></div>`;
}

export function spellCard (spell, fit = fitFor()) {
	return spellPanel(spell, spellUnits(spell), {
		fontPt: fit.defaultPt,
		title: escapeText(spell.name),
		indicatorsHtml: spellIndicators(spell),
		metaHtml: spellMetaHtml(spell),
		lineHeight: fit.defaultLineHeight,
	});
}

export function itemCard (item, fit = fitFor()) {
	return itemPanel(item, itemUnits(item), {
		fontPt: fit.defaultPt,
		title: escapeText(item.name),
		metaHtml: itemMetaHtml(item),
		lineHeight: fit.defaultLineHeight,
	});
}

export function spellFlow (spell, {mode, page, measure, fit = fitFor()}) {
	const floorPt = shrinkFloor(fit.defaultPt);
	const renderPanel = (units, {fontPt, continuation, ellipsis}) => spellPanel(spell, units, {
		fontPt,
		continuation,
		ellipsis,
		title: escapeText(spell.name),
		indicatorsHtml: spellIndicators(spell),
		metaHtml: spellMetaHtml(spell),
		lineHeight: lineHeightFor(fontPt, fit.defaultPt, floorPt, fit.defaultLineHeight, fit.minLineHeight),
	});
	return {
		entity: spell,
		...textFlow({units: spellUnits(spell), mode, page, defaultPt: fit.defaultPt, floorPt, measure, renderPanel}),
	};
}

export function itemFlow (item, {mode, page, measure, fit = fitFor()}) {
	const floorPt = shrinkFloor(fit.defaultPt);
	const renderPanel = (units, {fontPt, continuation, ellipsis}) => itemPanel(item, units, {
		fontPt,
		continuation,
		ellipsis,
		title: escapeText(item.name),
		metaHtml: itemMetaHtml(item),
		lineHeight: lineHeightFor(fontPt, fit.defaultPt, floorPt, fit.defaultLineHeight, fit.minLineHeight),
	});
	const units = itemUnits(item).flatMap(unit => {
		const oversized = !measure(renderPanel([unit], {fontPt: fit.defaultPt, continuation: true, ellipsis: false}));
		return oversized ? wordUnits(unit) : [unit];
	});
	return {
		entity: item,
		...textFlow({units, mode, page, defaultPt: fit.defaultPt, floorPt, measure, renderPanel}),
	};
}

globalThis.CardToolContent = {
	ELLIPSIS_HTML,
	SCHOOLS,
	DEFAULT_FIT,
	escapeText,
	spellOrdinal,
	resolveSpellClasses,
	spellClassLabel,
	spellTime,
	spellRange,
	spellDuration,
	spellComponents,
	spellIndicators,
	spellMetaHtml,
	itemMetaHtml,
	spellText,
	sentenceUnits,
	wordUnits,
	spellUnits,
	itemUnits,
	renderUnits,
	lineHeightFor,
	spellPanel,
	itemPanel,
	spellCard,
	itemCard,
	spellFlow,
	itemFlow,
};
