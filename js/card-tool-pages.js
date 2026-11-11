const LAYOUTS = new Set(["fronts", "backs", "both"]);

function mirrorRows (cards, rows, columns) {
	const mirrored = [];
	for (let row = 0; row < rows; row++) {
		const start = row * columns;
		mirrored.push(...cards.slice(start, start + columns).reverse());
	}
	return mirrored;
}

export function buildPagePlan (items, page, layout = "fronts") {
	const rows = page.rows;
	const columns = page.columns;
	const capacity = rows * columns;
	const normalizedLayout = LAYOUTS.has(layout) ? layout : "fronts";
	const plan = [];
	if (capacity <= 0) return plan;
	for (let offset = 0; offset < items.length; offset += capacity) {
		const chunk = items.slice(offset, offset + capacity);
		while (chunk.length < capacity) chunk.push(null);
		const sheetIndex = offset / capacity + 1;
		if (normalizedLayout !== "backs") plan.push({side: "front", sheetIndex, cards: chunk});
		if (normalizedLayout !== "fronts") plan.push({side: "back", sheetIndex, cards: mirrorRows(chunk, rows, columns)});
	}
	return plan;
}

globalThis.CardToolPages = {buildPagePlan};
