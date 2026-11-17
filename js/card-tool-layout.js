const MM_PER_INCH = 25.4;
const CSS_PX_PER_INCH = 96;

export const MM_TO_PX = CSS_PX_PER_INCH / MM_PER_INCH;
export const CARD_WIDTH_FLOOR = 200;
export const PAGE_GAP = 12;

export const PAGE_GEOMETRY = {
	landscape: {widthMm: 297, heightMm: 210, columns: 4, rows: 2},
	portrait: {widthMm: 210, heightMm: 297, columns: 2, rows: 2},
};

const DENSITIES = new Set(["auto", "large", "grid"]);

function geometryFor (page) {
	const orientation = page?.orientation === "portrait" ? "portrait" : "landscape";
	const base = PAGE_GEOMETRY[orientation];
	return {
		orientation,
		widthMm: base.widthMm,
		heightMm: base.heightMm,
		columns: Math.max(1, Number(page?.columns) || base.columns),
		rows: Math.max(1, Number(page?.rows) || base.rows),
	};
}

function positive (value) {
	const number = Number(value);
	return Number.isFinite(number) && number > 0 ? number : 0;
}

function describeCandidate ({cols, rows, geometry, availableWidth, availableHeight, aspect, printMax, paired}) {
	const pagesPerItem = paired ? 2 : 1;
	const pairGap = paired && cols > 1 ? PAGE_GAP : 0;
	const horizontalBudget = availableWidth - PAGE_GAP * (cols - 1) - pairGap;
	const verticalBudget = (availableHeight - PAGE_GAP * (rows - 1)) * aspect;
	const pageW = Math.max(0, Math.min(
		horizontalBudget / (cols * pagesPerItem),
		verticalBudget / rows,
		printMax,
	));
	const cardW = pageW / geometry.columns;
	const cardH = cardW * (geometry.heightMm / geometry.rows) / (geometry.widthMm / geometry.columns);
	return {
		cols,
		rows,
		paired,
		pagesPerItem,
		pages: cols * rows * pagesPerItem,
		pageW,
		pageH: pageW / aspect,
		cardW,
		cardH,
	};
}

export function computePreviewGrid ({availableWidth, availableHeight, page, layout, density, pageCount} = {}) {
	const geometry = geometryFor(page);
	const aspect = geometry.widthMm / geometry.heightMm;
	const printMax = geometry.widthMm * MM_TO_PX;
	const paired = layout === "both";
	const pagesPerItem = paired ? 2 : 1;
	const pages = Math.max(0, Math.floor(Number(pageCount) || 0));
	const items = paired ? Math.floor(pages / 2) : pages;
	const width = positive(availableWidth);
	const height = positive(availableHeight);
	const mode = DENSITIES.has(density) ? density : "auto";

	const fallback = (cols = 1, rows = 1, stacked = false) => {
		const pagesAcross = stacked ? 1 : pagesPerItem;
		const pagesDown = 1;
		const horizontal = width
			? Math.max(0, (width - PAGE_GAP * (cols - 1)) / (cols * pagesAcross))
			: printMax;
		const vertical = height
			? (Math.max(0, height - PAGE_GAP * (rows - 1)) * aspect) / (rows * pagesDown)
			: printMax;
		const pageW = Math.min(horizontal || printMax, vertical || printMax, printMax);
		const cardW = pageW / geometry.columns;
		return {
			cols,
			rows,
			paired,
			stacked,
			pagesPerItem,
			pages: cols * rows * pagesPerItem,
			pageW,
			pageH: pageW / aspect,
			cardW,
			cardH: cardW * (geometry.heightMm / geometry.rows) / (geometry.widthMm / geometry.columns),
			density: mode,
			plannedPages: pages,
		};
	};

	if (!width || !height) return fallback();

	if (mode === "large" || items < 1) return fallback();

	let best = null;
	const consider = (cols, rows) => {
		if (cols * rows > items) return;
		const candidate = describeCandidate({cols, rows, geometry, availableWidth: width, availableHeight: height, aspect, printMax, paired});
		if (candidate.cardW + 1e-6 < CARD_WIDTH_FLOOR) return;
		if (!best
			|| candidate.pages > best.pages
			|| (candidate.pages === best.pages && candidate.pageW > best.pageW + 1e-6)) {
			best = candidate;
		}
	};

	for (let cols = 1; cols <= items; cols++) {
		for (let rows = 1; rows * cols <= items; rows++) consider(cols, rows);
	}

	if (!best) return fallback(1, 1, paired);
	return {...best, stacked: false, density: mode, plannedPages: pages};
}

function emptyGroup (sheetIndex, side) {
	return {
		sheetIndex,
		side,
		label: side === "both" ? "Fronts and Backs" : side === "back" ? "Backs" : "Fronts",
		tiles: [],
	};
}

export function galleryGroups (plan, layout = "fronts") {
	const entries = Array.isArray(plan) ? plan : [];
	const groups = [];
	const bySheet = new Map();
	const wantedSides = layout === "backs" ? new Set(["back"]) : layout === "both" ? new Set(["front", "back"]) : new Set(["front"]);

	for (const entry of entries) {
		if (!entry || !wantedSides.has(entry.side)) continue;
		let group = bySheet.get(entry.sheetIndex);
		if (!group) {
			group = emptyGroup(entry.sheetIndex, layout === "both" ? "both" : entry.side);
			bySheet.set(entry.sheetIndex, group);
			groups.push(group);
		}
		const seen = group.seen ?? (group.seen = new Set());
		for (const cell of entry.cells ?? []) {
			if (!cell?.strip || seen.has(cell.strip)) continue;
			seen.add(cell.strip);
			const sides = {front: entry.side === "front", back: entry.side === "back"};
			group.tiles.push({
				strip: cell.strip,
				sheetIndex: entry.sheetIndex,
				side: layout === "backs" ? "back" : "front",
				sides,
				panels: Math.max(1, cell.strip.panels?.length ?? 1),
				paired: layout === "both",
			});
		}
	}

	for (const group of groups) {
		delete group.seen;
		if (layout === "both") {
			for (const tile of group.tiles) tile.sides = {front: true, back: true};
		}
	}
	return groups;
}

export function detailSequence (plan, layout = "fronts") {
	const entries = Array.isArray(plan) ? plan : [];
	const sequence = [];
	const byStrip = new Map();
	const wantedSides = layout === "backs" ? new Set(["back"]) : layout === "both" ? new Set(["front", "back"]) : new Set(["front"]);

	for (const entry of entries) {
		if (!entry || !wantedSides.has(entry.side)) continue;
		for (const cell of entry.cells ?? []) {
			if (!cell?.strip) continue;
			let item = byStrip.get(cell.strip);
			if (!item) {
				item = {
					strip: cell.strip,
					sheetIndex: entry.sheetIndex,
					panels: Math.max(1, cell.strip.panels?.length ?? 1),
					sides: {front: false, back: false},
				};
				byStrip.set(cell.strip, item);
				sequence.push(item);
			}
			item.sides[entry.side] = true;
		}
	}
	return sequence;
}

export function filterSelection (entities, query, listMeta) {
	const list = entities ? Array.from(entities) : [];
	const needle = String(query ?? "").trim().toLowerCase();
	if (!needle) return list;
	return list.filter(entity => {
		const fields = [entity?.name, entity?.source];
		if (typeof listMeta === "function") fields.push(listMeta(entity));
		return fields.some(value => String(value ?? "").toLowerCase().includes(needle));
	});
}

export function selectionMatches (entity, query, listMeta) {
	return filterSelection([entity], query, listMeta).length === 1;
}

globalThis.CardToolLayout = {
	MM_TO_PX,
	CARD_WIDTH_FLOOR,
	PAGE_GAP,
	PAGE_GEOMETRY,
	computePreviewGrid,
	galleryGroups,
	detailSequence,
	filterSelection,
	selectionMatches,
};
