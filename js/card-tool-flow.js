export const FLOW_BOUNDARIES = [1, 3, 5];
export const MIN_FONT_PT = 8.9;
export const DEFAULT_STEP_PT = 0.15;

const MM_TO_PX = 96 / 25.4;
const PAGE_MM = {
	landscape: {width: 297, height: 210},
	portrait: {width: 210, height: 297},
};

const round = value => Number(value.toFixed(4));

export function maxPanels (page) {
	return page?.columns >= 4 ? 5 : 3;
}

export function shrinkFloor (defaultPt) {
	return Math.max(MIN_FONT_PT, Number(defaultPt) * 0.9);
}

export function stripWidth (span, columns) {
	const width = Math.max(1, Number(columns) || 1);
	if (span <= 1) return 1;
	if (span <= 3) return Math.min(2, width);
	return Math.min(4, width);
}

export function bucketOf (span, truncated) {
	return truncated ? "truncated" : String(span);
}

export function panelRole (span, index) {
	if (span <= 1) return "only";
	if (index === 0) return "first";
	if (index === span - 1) return "last";
	return "middle";
}

export function sizeSteps (defaultPt, floorPt = shrinkFloor(defaultPt), stepPt = DEFAULT_STEP_PT) {
	const sizes = [];
	const steps = Math.max(0, Math.floor((defaultPt - floorPt) / stepPt + 1e-9));
	for (let index = 0; index <= steps; index++) sizes.push(round(defaultPt - index * stepPt));
	if (!sizes.length || sizes[sizes.length - 1] > floorPt + 1e-9) sizes.push(round(floorPt));
	return sizes;
}

export function fillPanels (units, span, measurePanel) {
	const panels = [];
	let consumed = 0;
	for (let panelIndex = 0; panelIndex < span; panelIndex++) {
		const available = units.length - consumed;
		if (available <= 0) {
			panels.push({units: [], ellipsis: false});
			continue;
		}
		let low = 0;
		let high = available;
		while (low < high) {
			const middle = Math.ceil((low + high) / 2);
			const candidate = units.slice(consumed, consumed + middle);
			if (measurePanel(candidate, {panelIndex, continuation: panelIndex > 0, ellipsis: false})) low = middle;
			else high = middle - 1;
		}
		panels.push({units: units.slice(consumed, consumed + low), ellipsis: false});
		consumed += low;
		if (!low) break;
	}
	while (panels.length < Math.max(0, span)) panels.push({units: [], ellipsis: false});
	return {panels, consumed, complete: consumed >= units.length};
}

export function fillWithEllipsis (units, measurePanel) {
	let low = 0;
	let high = units.length;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (measurePanel(units.slice(0, middle), {ellipsis: true})) low = middle;
		else high = middle - 1;
	}
	return {units: units.slice(0, low), consumed: low, complete: low >= units.length};
}

export function layoutPanels (units, span, measurePanel, truncate = false) {
	const result = fillPanels(units, span, measurePanel);
	if (!truncate || result.complete) return result;
	const headSpan = Math.max(0, span - 1);
	const head = fillPanels(units, headSpan, measurePanel);
	const remaining = units.slice(head.consumed);
	const tail = fillWithEllipsis(remaining, candidate => measurePanel(candidate, {
		panelIndex: span - 1,
		continuation: span > 1,
		ellipsis: true,
	}));
	const panels = [...head.panels];
	while (panels.length < headSpan) panels.push({units: [], ellipsis: false});
	panels.push({units: tail.units, ellipsis: true});
	return {panels, consumed: head.consumed + tail.consumed, complete: false};
}

export function chooseFlow ({mode, page, defaultPt, floorPt = shrinkFloor(defaultPt), stepPt = DEFAULT_STEP_PT, layout}) {
	const floor = Math.max(MIN_FONT_PT, floorPt);
	const sizes = sizeSteps(defaultPt, floor, stepPt);
	if (mode === "single") {
		for (const fontPt of sizes) {
			const result = layout(1, fontPt, false);
			if (result.complete) return {span: 1, fontPt, truncated: false, ...result};
		}
		return {span: 1, fontPt: floor, truncated: true, ...layout(1, floor, true)};
	}
	const cap = maxPanels(page);
	for (let span = 1; span <= cap; span++) {
		if (FLOW_BOUNDARIES.includes(span)) {
			for (const fontPt of sizes) {
				const result = layout(span, fontPt, false);
				if (result.complete) return {span, fontPt, truncated: false, ...result};
			}
			continue;
		}
		const result = layout(span, defaultPt, false);
		if (result.complete) return {span, fontPt: defaultPt, truncated: false, ...result};
	}
	return {span: cap, fontPt: floor, truncated: true, ...layout(cap, floor, true)};
}

export function textFlow ({units, mode, page, defaultPt, floorPt = shrinkFloor(defaultPt), measure, renderPanel}) {
	if (typeof measure !== "function") throw new Error("textFlow requires a measure function");
	const layout = (span, fontPt, truncate) => layoutPanels(
		units,
		span,
		(candidate, {panelIndex, continuation, ellipsis}) => measure(renderPanel(candidate, {fontPt, continuation, ellipsis})),
		truncate,
	);
	const chosen = chooseFlow({mode, page, defaultPt, floorPt, layout});
	const panels = chosen.panels.map((panel, index) => ({
		index,
		role: panelRole(chosen.span, index),
		continuation: index > 0,
		ellipsis: panel.ellipsis,
		html: renderPanel(panel.units, {fontPt: chosen.fontPt, continuation: index > 0, ellipsis: panel.ellipsis}),
	}));
	return {
		span: chosen.span,
		width: stripWidth(chosen.span, page.columns),
		bucket: mode === "single" ? "1" : bucketOf(chosen.span, chosen.truncated),
		truncated: chosen.truncated,
		fontPt: chosen.fontPt,
		panels,
	};
}

export function segmentSections (sections, fits, {maxPanels = Infinity, flattenText = value => String(value ?? ""), ellipsis = false} = {}) {
	const segments = [];
	let current = [];
	let truncated = false;
	const atCap = () => segments.length + 1 >= maxPanels;
	const merge = (base, title, entries) => {
		const result = base.map(([sectionTitle, sectionEntries]) => [sectionTitle, [...sectionEntries]]);
		const previous = result[result.length - 1];
		if (previous?.[0] === title) previous[1].push(...entries);
		else result.push([title, [...entries]]);
		return result;
	};
	const pushCurrent = () => {
		if (current.length) segments.push(current);
		current = [];
	};
	for (const section of sections) {
		if (truncated) break;
		const candidate = [...current, section];
		if (fits(candidate, {segmentIndex: segments.length, ellipsis: false})) {
			current = candidate;
			continue;
		}
		for (const entry of section[1]) {
			if (truncated) break;
			let remaining = flattenText(entry.entries).split(/\s+/).filter(Boolean);
			let isFirstFragment = true;
			while (remaining.length) {
				let fitCount = 0;
				for (let count = remaining.length; count > 0; count--) {
					const fragment = {...entry, name: isFirstFragment ? entry.name : "", entries: [remaining.slice(0, count).join(" ")]};
					if (fits(merge(current, section[0], [fragment]), {segmentIndex: segments.length, ellipsis: false})) {
						fitCount = count;
						break;
					}
				}
				if (!fitCount) {
					if (current.length) {
						if (atCap()) {
							truncated = true;
							break;
						}
						pushCurrent();
						continue;
					}
					fitCount = 1;
				}
				const fragment = {...entry, name: isFirstFragment ? entry.name : "", entries: [remaining.slice(0, fitCount).join(" ")]};
				current = merge(current, section[0], [fragment]);
				remaining = remaining.slice(fitCount);
				isFirstFragment = false;
			}
		}
	}
	if (current.length) segments.push(current);
	if (!segments.length) segments.push([]);
	if (truncated && ellipsis) markTruncated(segments, fits, flattenText);
	return {segments, truncated};
}

function markTruncated (segments, fits, flattenText) {
	const last = segments[segments.length - 1];
	if (!last?.length) return;
	const [title, entries] = last[last.length - 1];
	if (!entries.length) return;
	const entry = entries[entries.length - 1];
	let words = flattenText(entry.entries).split(/\s+/).filter(Boolean);
	while (words.length) {
		const candidateEntry = {...entry, entries: [`${words.join(" ")} …`]};
		const candidate = [...last.slice(0, -1), [title, [...entries.slice(0, -1), candidateEntry]]];
		if (fits(candidate, {segmentIndex: segments.length - 1, ellipsis: true})) break;
		words.pop();
	}
	last[last.length - 1] = [title, [...entries.slice(0, -1), {...entry, entries: [words.length ? `${words.join(" ")} …` : "…"]}]];
}

function overflows (element) {
	return element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
}

export function createMeasure (page) {
	if (typeof document === "undefined") throw new Error("createMeasure requires a document");
	const orientation = page.orientation === "portrait" ? "portrait" : "landscape";
	const width = PAGE_MM[orientation].width * MM_TO_PX;
	const height = PAGE_MM[orientation].height * MM_TO_PX;
	const host = document.createElement("div");
	host.className = "page flow-probe";
	host.style.cssText = `position:absolute;left:-10000px;top:0;width:${width}px;height:${height}px;display:grid;grid-template-columns:repeat(${page.columns},1fr);grid-template-rows:repeat(${page.rows},1fr);visibility:hidden;pointer-events:none`;
	const card = document.createElement("div");
	card.className = "card flow-probe-card";
	card.style.cssText = `width:${width / page.columns}px;height:${height / page.rows}px;overflow:hidden;display:flex;flex-direction:column;background:white`;
	host.appendChild(card);
	document.body.appendChild(host);
	const measure = html => {
		card.innerHTML = html;
		const inner = card.querySelector(".card-inner") || card;
		const title = inner.querySelector(".entity-title");
		if (title) title.style.fontSize = "14pt";
		const content = [card, inner, ...inner.querySelectorAll(".entity-body, .beast-statblock")];
		return !content.some(overflows);
	};
	measure.dispose = () => host.remove();
	return measure;
}

globalThis.CardToolFlow = {
	FLOW_BOUNDARIES,
	MIN_FONT_PT,
	maxPanels,
	shrinkFloor,
	stripWidth,
	bucketOf,
	panelRole,
	sizeSteps,
	fillPanels,
	fillWithEllipsis,
	layoutPanels,
	chooseFlow,
	textFlow,
	segmentSections,
	createMeasure,
};
