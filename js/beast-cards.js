import {flattenCardEntries, formatCardText} from "./card-tool-text.js";

const BEAST_DEFAULT_PT = 11;
const beastEscape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const beastType = beast => typeof beast.type === "string" ? beast.type : beast.type?.type || "";
const beastSizeMap = { F: "Fine", D: "Diminutive", T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan", C: "Colossal", V: "Varies" };
const beastAlignmentMap = { L: "lawful", N: "neutral", NX: "neutral (law/chaos axis)", NY: "neutral (good/evil axis)", C: "chaotic", G: "good", E: "evil", U: "unaligned", A: "any alignment" };
const beastSize = beast => (Array.isArray(beast.size) ? beast.size : [beast.size]).filter(Boolean).map(size => beastSizeMap[size] || size).join(", ");
const beastAlignment = beast => {
	if (!beast.alignment) return "";
	if (typeof beast.alignment === "object" && !Array.isArray(beast.alignment)) {
		if (beast.alignment.special != null) return beast.alignment.special;
		return beastAlignment({ alignment: beast.alignment.alignment }) + (beast.alignment.chance ? ` (${beast.alignment.chance}%)` : "") + (beast.alignment.note ? ` (${beast.alignment.note})` : "");
	}
	if (!Array.isArray(beast.alignment)) return beastAlignmentMap[beast.alignment.toUpperCase()] || beast.alignment;
	if (beast.alignment.length === 3 && ["NX", "NY", "N"].every(value => beast.alignment.includes(value))) return "any neutral alignment";
	return beast.alignment.map(alignment => beastAlignmentMap[alignment] || alignment).join(" ");
};
const beastModifier = score => {
	const value = Number(score);
	if (!Number.isFinite(value)) return "—";
	const modifier = Math.floor((value - 10) / 2);
	return `${modifier >= 0 ? "+" : ""}${modifier}`;
};
const beastText = entries => flattenCardEntries(entries || []);
const beastInline = value => beastEscape(formatCardText(Array.isArray(value) ? beastText(value) : value));
const beastCollection = values => Array.isArray(values) ? values.map(value => typeof value === "string" ? value : value?.name || "").filter(Boolean).join(", ") : "";
const beastAc = beast => Array.isArray(beast.ac) ? beast.ac.map(value => typeof value === "object" ? `${value.ac}${value.from?.length ? ` (${value.from.join(", ")})` : ""}` : value).join(", ") : beast.ac || "—";
const beastSpeed = beast => Object.entries(beast.speed || {}).map(([kind, value]) => `${kind} ${typeof value === "object" ? value.number : value} ft.`).join(", ") || "—";
const beastDetails = beast => [
	beast.save && ["Saves", Object.entries(beast.save).map(([key, value]) => `${key.toUpperCase()} ${value}`).join(", ")],
	beast.skill && ["Skills", Object.entries(beast.skill).map(([key, value]) => `${key} ${value}`).join(", ")],
	beast.senses && ["Senses", beastCollection(beast.senses)],
	beast.passive && ["Passive Perception", beast.passive],
	beast.languages && ["Languages", beastCollection(beast.languages)],
	beast.resist && ["Resistances", beastCollection(beast.resist)],
	beast.immune && ["Immunities", beastCollection(beast.immune)],
	beast.conditionImmune && ["Condition Immunities", beastCollection(beast.conditionImmune)],
	beast.cr && ["CR", typeof beast.cr === "object" ? beast.cr.cr : beast.cr],
].filter(Boolean).map(([label, value]) => `<div><b>${beastEscape(label)}</b> ${beastEscape(value)}</div>`).join("");
const beastSectionsData = beast => [
	["Traits", beast.trait],
	["Actions", beast.action],
	["Bonus Actions", beast.bonus],
	["Reactions", beast.reaction],
	["Legendary Actions", beast.legendary],
	["Mythic Actions", beast.mythic],
].filter(([, entries]) => entries?.length);
const beastSections = (sections, suppressFirstHeading = false) => {
	const merged = sections.reduce((result, [title, entries]) => {
		const previous = result[result.length - 1];
		if (previous?.[0] === title) previous[1].push(...entries);
		else result.push([title, [...entries]]);
		return result;
	}, []);
	return merged.map(([title, entries], index) => `<section class="beast-section">${!(suppressFirstHeading && index === 0) ? `<h3>${title}</h3>` : ""}${entries.map(entry => `<div class="beast-entry"><strong>${beastEscape(formatCardText(entry.name || ""))}</strong> <span>${beastInline(entry.entries)}</span></div>`).join("")}</section>`).join("");
};
const beastFits = (beast, segmentSections, segmentIndex, compact = false, bodyPt = null) => {
	const page = document.createElement("div");
	page.className = "screen-page";
	page.style.cssText = "position:absolute;left:-10000px;top:0;width:794px;height:1122px;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);visibility:hidden";
	const card = document.createElement("div");
	card.className = "screen-card";
	card.innerHTML = beastCard({ ...beast, segmentSections, segmentIndex, compact, bodyPt });
	page.appendChild(card);
	document.body.appendChild(page);
	const statblock = card.querySelector(".beast-statblock");
	const title = card.querySelector(".beast-title");
	if (title) title.style.fontSize = `${Math.min(14, (bodyPt ?? BEAST_DEFAULT_PT) * 1.27)}pt`;
	const lineHeight = parseFloat(getComputedStyle(statblock).lineHeight) || 1;
	const overflowLines = Math.max(0, statblock.scrollHeight - statblock.clientHeight) / lineHeight;
	const fits = overflowLines <= 0.1;
	page.remove();
	return { fits, overflowLines };
};
const beastMergeLast = (beast, segments, fontPt) => {
	if (segments.length < 2) return { segments, compact: new Set() };
	const combined = segments.at(-2).map(([title, entries]) => [title, [...entries]]);
	for (const [title, entries] of segments.at(-1)) {
		const previous = combined.at(-1);
		if (previous?.[0] === title) previous[1].push(...entries);
		else combined.push([title, [...entries]]);
	}
	const index = segments.length - 2;
	const defaultMeasure = beastFits(beast, combined, index, false, fontPt);
	if (defaultMeasure.overflowLines <= 2 && beastFits(beast, combined, index, true, fontPt).fits) {
		const merged = [...segments.slice(0, -2), combined];
		return { segments: merged, compact: new Set([merged.length - 1]) };
	}
	return { segments, compact: new Set() };
};

const beastStrip = (beast, segments, { page, truncated, fontPt, compact = new Set(), single = false }) => {
	const flow = globalThis.CardToolFlow;
	const span = segments.length;
	return {
		entity: beast,
		span,
		width: flow.stripWidth(span, page.columns),
		bucket: single ? "1" : flow.bucketOf(span, truncated),
		truncated,
		fontPt,
		panels: segments.map((sections, index) => ({
			index,
			role: flow.panelRole(span, index),
			continuation: index > 0,
			html: beastCard({ ...beast, segmentSections: sections, segmentIndex: index, segmentCount: span, compact: compact.has(index), bodyPt: fontPt, previousSections: segments[index - 1] }),
		})),
	};
};

const beastFlow = (beast, { mode, page }) => {
	const flow = globalThis.CardToolFlow;
	const sections = beastSectionsData(beast);
	const floorPt = flow.shrinkFloor(BEAST_DEFAULT_PT);
	if (mode === "single") {
		for (const fontPt of flow.sizeSteps(BEAST_DEFAULT_PT, floorPt)) {
			if (beastFits(beast, sections, 0, false, fontPt).fits) {
				return beastStrip(beast, [sections], { page, truncated: false, fontPt, single: true });
			}
		}
		const { segments } = flow.segmentSections(
			sections,
			(candidate, { segmentIndex }) => beastFits(beast, candidate, segmentIndex, false, floorPt).fits,
			{ maxPanels: 1, flattenText: beastText, ellipsis: true },
		);
		return beastStrip(beast, segments, { page, truncated: true, fontPt: floorPt, single: true });
	}
	const cap = flow.maxPanels(page);
	let { segments, truncated } = flow.segmentSections(
		sections,
		(candidate, { segmentIndex }) => beastFits(beast, candidate, segmentIndex, false, BEAST_DEFAULT_PT).fits,
		{ maxPanels: cap, flattenText: beastText, ellipsis: true },
	);
	let compact = new Set();
	if (!truncated) ({ segments, compact } = beastMergeLast(beast, segments, BEAST_DEFAULT_PT));
	return beastStrip(beast, segments, { page, truncated, fontPt: BEAST_DEFAULT_PT, compact });
};
const beastCard = beast => {
	const isContinuation = beast.segmentIndex > 0;
	const sections = beast.segmentSections || beastSectionsData(beast);
	const continuesSection = isContinuation && beast.previousSections?.at(-1)?.[0] === sections[0]?.[0];
	const titleSuffix = isContinuation ? " contd." : "";
	return `<div class="card-inner"><article class="entity-card beast-statblock${beast.compact ? " beast-compact" : ""}" style="--beast-body-pt:${beast.bodyPt ?? BEAST_DEFAULT_PT}pt"><h1 class="entity-title beast-title" data-title-suffix="${titleSuffix}">${beastEscape(beast.name)}${titleSuffix}</h1>${!isContinuation ? `<div class="beast-subtitle">${beastEscape([beastSize(beast), beastType(beast), beastAlignment(beast)].filter(Boolean).join(" · "))}</div><div class="beast-rule"></div><div class="beast-core"><span><b>AC</b> ${beastEscape(beastAc(beast))}</span><span><b>HP</b> ${beastEscape(beast.hp?.average ? `${beast.hp.average} (${beast.hp.formula || ""})` : "—")}</span><span><b>Speed</b> ${beastEscape(beastSpeed(beast))}</span></div><div class="beast-abilities">${[["STR", beast.str], ["DEX", beast.dex], ["CON", beast.con], ["INT", beast.int], ["WIS", beast.wis], ["CHA", beast.cha]].map(([label, score]) => `<div><b>${label}</b><span>${beastEscape(score)} (${beastModifier(score)})</span></div>`).join("")}</div><div class="beast-details">${beastDetails(beast)}</div>` : ""}${beastSections(sections, continuesSection)}</article></div>`;
};
const beastBack = beast => `<div class="card-inner"><div class="entity-back"><small>Beast Card</small><h1 class="back-card-title">${beastEscape(beast.name)}</h1><span>${beastEscape(beast.cr ? `Challenge ${typeof beast.cr === "object" ? beast.cr.cr : beast.cr}` : beast.source)}</span>${beast.imageHref ? `<img class="entity-back-image" src="${beastEscape(beast.imageHref)}" alt="" onerror="this.remove()">` : ""}</div></div>`;
CardTool.start({ type: "beast", page: { rows: 2, columns: 2, orientation: "portrait" }, defaultContentMode: "overflow", entityLabel: "Beasts", title: "Beast Card Printer", base: "./5etools/data/bestiary/", payload: "monster", files: ["bestiary-mm", "bestiary-xmm", "bestiary-mpmm"], baseSources: ["MM", "XMM", "MPMM"], prepare: async beasts => {
	const fluff = (await Promise.all(["mm", "xmm", "mpmm"].map(file => fetch(`./5etools/data/bestiary/fluff-bestiary-${file}.json`).then(response => response.ok ? response.json() : null)))).flatMap(data => data?.monsterFluff || []);
	const byId = new Map(fluff.map(entry => [`${entry.source}|${entry.name}`, entry.images?.[0]?.href?.path]).filter(([, path]) => path));
	return beasts.map(beast => ({ ...beast, imageHref: byId.get(`${beast.source}|${beast.name}`) ? `img/${byId.get(`${beast.source}|${beast.name}`)}` : null }));
}, filters: [{ id: "source", label: "Source", values: beast => [beast.source] }, { id: "type", label: "Type", values: beast => [beastType(beast)] }], sortOptions: [{ value: "name", label: "Name A to Z" }, { value: "source", label: "Source" }], sort: (a, b, mode) => mode === "source" ? a.source.localeCompare(b.source) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name), color: () => "#9a3a3a", listMeta: beast => [beastSize(beast), beastType(beast), beast.source].filter(Boolean).join(" · "), flow: beastFlow, render: (side, beast) => side === "back" ? beastBack(beast) : beastCard(beast) });
