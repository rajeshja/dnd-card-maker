const LAYOUTS = new Set(["fronts", "backs", "both"]);
const BUCKET_ORDER = ["1", "2", "3", "4", "5", "truncated"];

function bucketRank (bucket) {
	const index = BUCKET_ORDER.indexOf(bucket);
	return index === -1 ? BUCKET_ORDER.length : index;
}

function backRoles (span) {
	if (span <= 1) return ["art"];
	if (span === 2) return ["art", "art"];
	if (span === 3) return ["art", "page"];
	if (span === 4) return ["art", "blank", "blank", "art"];
	return ["art", "blank", "blank", "page"];
}

function sheetCapacity (rows, columns, width) {
	return Math.max(1, Math.floor(columns / Math.max(1, Math.min(width, columns)))) * rows;
}

function buildFrontCells (strips, rows, columns) {
	const cells = [];
	for (const strip of strips) {
		const width = Math.max(1, Math.min(strip.width ?? 1, columns));
		for (let panelIndex = 0; panelIndex < width; panelIndex++) {
			cells.push({strip, panelIndex, back: null, guides: null});
		}
	}
	const capacity = rows * columns;
	while (cells.length < capacity) cells.push(null);
	return cells.slice(0, capacity);
}

function buildBackCells (frontCells, rows, columns) {
	const backCells = new Array(rows * columns).fill(null);
	frontCells.forEach((cell, index) => {
		if (!cell) return;
		const row = Math.floor(index / columns);
		const column = index % columns;
		const mirror = row * columns + (columns - 1 - column);
		const span = cell.strip.span ?? 1;
		const role = backRoles(span)[cell.panelIndex] ?? "blank";
		const panelIndex = role === "page" ? Math.max(0, span - 1) : cell.panelIndex;
		backCells[mirror] = {strip: cell.strip, panelIndex, back: role, guides: null};
	});
	return backCells;
}

function assignGuides (cells, rows, columns) {
	cells.forEach((cell, index) => {
		if (!cell) return;
		const row = Math.floor(index / columns);
		const column = index % columns;
		let right = null;
		if (column < columns - 1) {
			const neighbour = cells[index + 1];
			right = neighbour && neighbour.strip === cell.strip ? "fold" : "cut";
		}
		const bottom = row < rows - 1 && cells[index + columns] ? "cut" : null;
		cell.guides = {right, bottom};
	});
	return cells;
}

export function buildPagePlan (strips, page, layout = "fronts") {
	const rows = Math.max(0, page?.rows ?? 0);
	const columns = Math.max(0, page?.columns ?? 0);
	const capacity = rows * columns;
	const normalizedLayout = LAYOUTS.has(layout) ? layout : "fronts";
	const plan = [];
	if (capacity <= 0 || !Array.isArray(strips) || !strips.length) return plan;
	const buckets = new Map();
	for (const strip of strips) {
		if (!strip) continue;
		const bucket = strip.bucket ?? "1";
		if (!buckets.has(bucket)) buckets.set(bucket, []);
		buckets.get(bucket).push(strip);
	}
	const orderedBuckets = [...buckets.entries()].sort(([left], [right]) => bucketRank(left) - bucketRank(right));
	let sheetIndex = 0;
	for (const [bucket, bucketStrips] of orderedBuckets) {
		if (!bucketStrips.length) continue;
		const width = Math.max(1, Math.min(bucketStrips[0].width ?? 1, columns));
		const perSheet = sheetCapacity(rows, columns, width);
		for (let offset = 0; offset < bucketStrips.length; offset += perSheet) {
			const chunk = bucketStrips.slice(offset, offset + perSheet);
			const frontCells = assignGuides(buildFrontCells(chunk, rows, columns), rows, columns);
			const backCells = assignGuides(buildBackCells(frontCells, rows, columns), rows, columns);
			sheetIndex++;
			if (normalizedLayout !== "backs") plan.push({side: "front", sheetIndex, bucket, cells: frontCells});
			if (normalizedLayout !== "fronts") plan.push({side: "back", sheetIndex, bucket, cells: backCells});
		}
	}
	return plan;
}

globalThis.CardToolPages = {buildPagePlan};
