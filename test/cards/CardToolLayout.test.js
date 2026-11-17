import {
	CARD_WIDTH_FLOOR,
	MM_TO_PX,
	PAGE_GEOMETRY,
	cardSequence,
	computePreviewGrid,
	detailSequence,
	filterSelection,
	galleryGroups,
	printOrderMatchesInspection,
	selectionMatches,
} from "../../js/card-tool-layout.js";
import {buildPagePlan} from "../../js/card-tool-pages.js";

const LANDSCAPE = {rows: 2, columns: 4, orientation: "landscape"};
const PORTRAIT = {rows: 2, columns: 2, orientation: "portrait"};

const sidebarWidth = width => Math.min(380, Math.max(300, width * 0.22));
const previewArea = (width, height) => {
	const compact = height <= 820;
	const topbar = compact ? 48 : 56;
	const bar = compact ? 40 : 44;
	const padding = 19.2 * 2;
	return {
		availableWidth: width - sidebarWidth(width) - padding,
		availableHeight: height - topbar - bar - padding,
	};
};

const gridAt = (width, height, {page = LANDSCAPE, layout = "fronts", density = "auto", pageCount = 8} = {}) => computePreviewGrid({
	...previewArea(width, height),
	page,
	layout,
	density,
	pageCount,
});

const widthForSpan = span => span <= 2 ? span : span === 3 ? 2 : 4;

let stripSequence = 0;
const strip = (name, {span = 1, bucket = String(span), width = widthForSpan(span)} = {}) => {
	stripSequence++;
	return {
		entity: {name, source: "TEST"},
		span,
		width,
		bucket,
		truncated: false,
		fontPt: 9.8,
		panels: Array.from({length: span}, (_, index) => ({
			index,
			role: span === 1 ? "only" : index === 0 ? "first" : index === span - 1 ? "last" : "middle",
			html: `<card>${name}:${index + 1}</card>`,
			continuation: index > 0,
		})),
		sequence: stripSequence,
	};
};

describe("page geometry constants", () => {
	it("keeps A4 print sizes in millimetres and CSS pixels", () => {
		expect(PAGE_GEOMETRY.landscape).toMatchObject({widthMm: 297, heightMm: 210, columns: 4, rows: 2});
		expect(PAGE_GEOMETRY.portrait).toMatchObject({widthMm: 210, heightMm: 297, columns: 2, rows: 2});
		expect(PAGE_GEOMETRY.landscape.widthMm * MM_TO_PX).toBeCloseTo(1122.5, 1);
		expect(PAGE_GEOMETRY.portrait.widthMm * MM_TO_PX).toBeCloseTo(793.7, 1);
		expect(CARD_WIDTH_FLOOR).toBe(200);
	});
});

describe("computePreviewGrid reference viewports", () => {
	it("shows one landscape page at 1366x768", () => {
		const grid = gridAt(1366, 768);

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 1, rows: 1});
		expect(grid.pageW).toBeGreaterThan(890);
		expect(grid.pageW).toBeLessThan(930);
		expect(grid.cardW).toBeGreaterThan(220);
		expect(grid.cardW).toBeLessThan(240);
	});

	it("shows one near-print-size page at 1600x900", () => {
		const grid = gridAt(1600, 900);

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 1, rows: 1});
		expect(grid.cardW).toBeGreaterThan(260);
		expect(grid.cardW).toBeLessThan(280);
	});

	it("caps the page at physical print size at 1920x1080", () => {
		const grid = gridAt(1920, 1080);
		const printMax = PAGE_GEOMETRY.landscape.widthMm * MM_TO_PX;

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 1, rows: 1});
		expect(grid.pageW).toBeCloseTo(printMax, 5);
		expect(grid.cardW).toBeCloseTo(printMax / 4, 5);
	});

	it("shows two pages side by side at 2560x1080", () => {
		const grid = gridAt(2560, 1080);

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 2, rows: 1});
		expect(grid.cardW).toBeGreaterThan(250);
		expect(grid.cardW).toBeLessThan(275);
	});

	it("shows a 2x2 page grid at 2560x1440", () => {
		const grid = gridAt(2560, 1440);

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 2, rows: 2});
		expect(grid.pages).toBe(4);
		expect(grid.cardW).toBeGreaterThan(215);
		expect(grid.cardW).toBeLessThan(240);
	});
});

describe("computePreviewGrid caps and floors", () => {
	it("never grows a page beyond the physical print width", () => {
		const grid = gridAt(4000, 3000, {pageCount: 4});

		expect(grid.pageW).toBeCloseTo(PAGE_GEOMETRY.landscape.widthMm * MM_TO_PX, 5);
		expect(grid.cardW).toBeLessThanOrEqual(PAGE_GEOMETRY.landscape.widthMm * MM_TO_PX / 4 + 0.001);
	});

	it("falls back to the largest single page below the legibility floor", () => {
		const grid = gridAt(900, 500, {pageCount: 4});

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 1, rows: 1});
		expect(grid.cardW).toBeLessThan(CARD_WIDTH_FLOOR);
		expect(grid.pageW).toBeGreaterThan(0);
	});

	it("keeps every accepted candidate at or above the 200px card floor", () => {
		for (const viewport of [[1366, 768], [1600, 900], [1920, 1080], [2560, 1080], [2560, 1440]]) {
			const grid = gridAt(...viewport);
			expect(grid.cardW).toBeGreaterThanOrEqual(CARD_WIDTH_FLOOR);
		}
	});

	it("fits more portrait pages per row earlier", () => {
		const grid = gridAt(1366, 768, {page: PORTRAIT});

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 2, rows: 1});
		expect(grid.cardW).toBeGreaterThan(220);
		expect(grid.cardW).toBeLessThan(235);
	});

	it("uses a 3x2 portrait grid at 2560x1440 for six planned pages", () => {
		const grid = gridAt(2560, 1440, {page: PORTRAIT, pageCount: 6});

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 3, rows: 2});
		expect(grid.pages).toBe(6);
		expect(grid.cardW).toBeGreaterThan(220);
		expect(grid.cardW).toBeLessThan(235);
	});
});

describe("computePreviewGrid density", () => {
	it("Auto follows the responsive table", () => {
		const grid = gridAt(2560, 1440);

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 2, rows: 2});
	});

	it("Large always shows one page at the largest size that fits", () => {
		const grid = gridAt(2560, 1440, {density: "large"});

		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 1, rows: 1});
		expect(grid.pageW).toBeCloseTo(PAGE_GEOMETRY.landscape.widthMm * MM_TO_PX, 5);
	});

	it("Grid maximizes visible pages while respecting the floor", () => {
		const auto = gridAt(2560, 1440, {density: "auto"});
		const grid = gridAt(2560, 1440, {density: "grid"});

		expect(grid.pages).toBeGreaterThanOrEqual(auto.pages);
		expect(grid.cardW).toBeGreaterThanOrEqual(CARD_WIDTH_FLOOR);
		if (grid.pages > 1) expect(grid.cols * grid.rows).toBeGreaterThan(1);
	});
});

describe("computePreviewGrid Both pairing", () => {
	it("counts grid columns in sheet pairs, not pages", () => {
		const grid = gridAt(2560, 1440, {layout: "both", pageCount: 4});

		expect(grid.paired).toBe(true);
		expect(grid.pagesPerItem).toBe(2);
		expect({cols: grid.cols, rows: grid.rows}).toEqual({cols: 1, rows: 2});
		expect(grid.pages).toBe(4);
		expect(grid.cardW).toBeGreaterThanOrEqual(CARD_WIDTH_FLOOR);
	});

	it("keeps a paired grid when many pages fit at a large viewport", () => {
		const grid = computePreviewGrid({
			availableWidth: 3800,
			availableHeight: 3000,
			page: LANDSCAPE,
			layout: "both",
			density: "auto",
			pageCount: 8,
		});

		expect(grid.paired).toBe(true);
		expect(grid.pages).toBe(8);
		expect(grid.pages / grid.pagesPerItem).toBe(grid.cols * grid.rows);
	});

	it("stacks the fallback pair when no pair candidate meets the floor", () => {
		const grid = gridAt(1366, 768, {layout: "both", pageCount: 8});

		expect(grid.paired).toBe(true);
		expect(grid.stacked).toBe(true);
		expect(grid.cardW).toBeGreaterThanOrEqual(CARD_WIDTH_FLOOR);
	});

	it("ignores an odd trailing page when counting pairs", () => {
		const grid = computePreviewGrid({
			availableWidth: 1500,
			availableHeight: 900,
			page: LANDSCAPE,
			layout: "both",
			pageCount: 3,
		});

		expect(grid.pages).toBeLessThanOrEqual(3);
	});
});

describe("galleryGroups", () => {
	it("groups front tiles by sheet in plan order", () => {
		const strips = Array.from({length: 10}, (_, index) => strip(`Card ${index}`));
		const plan = buildPagePlan(strips, LANDSCAPE, "both");
		const groups = galleryGroups(plan, "front");

		expect(groups).toHaveLength(2);
		expect(groups.map(group => group.sheetIndex)).toEqual([1, 2]);
		expect(groups.map(group => group.side)).toEqual(["front", "front"]);
		expect(groups.map(group => group.label)).toEqual(["Fronts", "Fronts"]);
		expect(groups.map(group => group.tiles.length)).toEqual([8, 2]);
		expect(groups[0].tiles.map(tile => tile.strip.entity.name)).toEqual(strips.slice(0, 8).map(item => item.entity.name));
	});

	it("omits empty padding positions", () => {
		const plan = buildPagePlan([strip("Only")], LANDSCAPE, "both");
		const groups = galleryGroups(plan, "front");

		expect(groups).toHaveLength(1);
		expect(groups[0].tiles).toHaveLength(1);
		expect(groups[0].tiles[0].strip.entity.name).toBe("Only");
	});

	it("shows a multi-panel logical card once with its panel count", () => {
		const plan = buildPagePlan([strip("Triple", {span: 3}), strip("Single")], PORTRAIT, "both");
		const groups = galleryGroups(plan, "front");
		const tiles = groups.flatMap(group => group.tiles);
		const triple = tiles.filter(tile => tile.strip.entity.name === "Triple");

		expect(triple).toHaveLength(1);
		expect(triple[0].panels).toBe(3);
		expect(tiles.map(tile => tile.strip.entity.name)).toEqual(["Single", "Triple"]);
	});

	it("labels back groups with the displayed side", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D")], LANDSCAPE, "both");
		const groups = galleryGroups(plan, "back");

		expect(groups).toHaveLength(1);
		expect(groups[0].side).toBe("back");
		expect(groups[0].label).toBe("Backs");
		expect(groups[0].tiles.every(tile => tile.side === "back")).toBe(true);
		expect(groups[0].tiles.every(tile => tile.sides.front && tile.sides.back)).toBe(true);
		expect(groups[0].tiles.every(tile => !("paired" in tile))).toBe(true);
	});

	it("keeps card order and sheet grouping when the displayed side changes", () => {
		const strips = [
			...Array.from({length: 6}, (_, index) => strip(`One ${index}`)),
			strip("Triple", {span: 3}),
		];
		const plan = buildPagePlan(strips, LANDSCAPE, "both");
		const fronts = galleryGroups(plan, "front");
		const backs = galleryGroups(plan, "back");

		expect(fronts.map(group => group.sheetIndex)).toEqual(backs.map(group => group.sheetIndex));
		expect(fronts.map(group => group.tiles.length)).toEqual(backs.map(group => group.tiles.length));
		expect(fronts.flatMap(group => group.tiles.map(tile => tile.strip)).join())
			.toBe(backs.flatMap(group => group.tiles.map(tile => tile.strip)).join());
	});

	it("groups a backs-only plan from its back entries", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D")], LANDSCAPE, "backs");
		const groups = galleryGroups(plan, "back");

		expect(groups).toHaveLength(1);
		expect(groups[0].label).toBe("Backs");
		expect(groups[0].tiles.map(tile => tile.strip.entity.name)).toEqual(["D", "C", "B", "A"]);
	});

	it("shows no tiles for a side the plan does not contain", () => {
		const plan = buildPagePlan([strip("A"), strip("B")], LANDSCAPE, "fronts");

		expect(galleryGroups(plan, "back")).toEqual([]);
	});
});

describe("detailSequence", () => {
	it("follows the inspection plan order and records both sides", () => {
		const strips = [strip("A"), strip("B"), strip("C")];
		const sequence = detailSequence(buildPagePlan(strips, LANDSCAPE, "both"));

		expect(sequence.map(item => item.strip.entity.name)).toEqual(["A", "B", "C"]);
		expect(sequence.every(item => item.sides.front && item.sides.back)).toBe(true);
		expect(sequence.map(item => item.sheetIndex)).toEqual([1, 1, 1]);
	});

	it("deduplicates a multi-panel strip into one navigable card", () => {
		const plan = buildPagePlan([strip("Triple", {span: 3})], PORTRAIT, "both");
		const sequence = detailSequence(plan);

		expect(sequence).toHaveLength(1);
		expect(sequence[0].panels).toBe(3);
	});

	it("deduplicates a backs-only plan in its own cell order", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D")], LANDSCAPE, "backs");
		const sequence = detailSequence(plan);

		expect(sequence.map(item => item.strip.entity.name)).toEqual(["D", "C", "B", "A"]);
		expect(sequence.every(item => item.sides.back && !item.sides.front)).toBe(true);
	});

	it("offers one entry per logical card under Both", () => {
		const strips = Array.from({length: 10}, (_, index) => strip(`Card ${index}`));
		const sequence = detailSequence(buildPagePlan(strips, LANDSCAPE, "both"));

		expect(sequence).toHaveLength(strips.length);
		expect(new Set(sequence.map(item => item.strip)).size).toBe(strips.length);
		expect(sequence.map(item => item.strip.entity.name)).toEqual(strips.map(item => item.entity.name));
	});

	it("keeps a stable sequence when the print layout changes presentation only", () => {
		const strips = [strip("A"), strip("B")];
		const fronts = detailSequence(buildPagePlan(strips, LANDSCAPE, "fronts"));
		const both = detailSequence(buildPagePlan(strips, LANDSCAPE, "both"));

		expect(both.map(item => item.strip.entity.name)).toEqual(fronts.map(item => item.strip.entity.name));
	});
});

describe("printOrderMatchesInspection", () => {
	it("keeps every print layout on the inspection order", () => {
		const strips = [
			...Array.from({length: 7}, (_, index) => strip(`One ${index}`)),
			strip("Double", {span: 2}),
			strip("Triple", {span: 3}),
			strip("Quad", {span: 4}),
		];

		expect(printOrderMatchesInspection(strips, LANDSCAPE)).toEqual({fronts: true, backs: true, both: true});
		expect(printOrderMatchesInspection(strips, PORTRAIT)).toEqual({fronts: true, backs: true, both: true});
	});

	it("compares the inspection sequence against front, back, and both print plans", () => {
		const strips = [strip("A"), strip("B"), strip("C"), strip("D")];

		expect(cardSequence(buildPagePlan(strips, LANDSCAPE, "both"), LANDSCAPE).map(item => item.strip.entity.name))
			.toEqual(["A", "B", "C", "D"]);
		expect(cardSequence(buildPagePlan(strips, LANDSCAPE, "backs"), LANDSCAPE).map(item => item.strip.entity.name))
			.toEqual(["A", "B", "C", "D"]);
	});
});

describe("filterSelection", () => {
	const entities = [
		{name: "Fireball", source: "PHB", level: 3, school: "V"},
		{name: "Cure Wounds", source: "PHB", level: 1, school: "V"},
		{name: "Ice Knife", source: "XGE", level: 1, school: "C"},
	];
	const meta = entity => `Level ${entity.level} · ${entity.school}`;

	it("matches names case-insensitively", () => {
		expect(filterSelection(entities, "fire", meta).map(entity => entity.name)).toEqual(["Fireball"]);
		expect(filterSelection(entities, "FIRE", meta).map(entity => entity.name)).toEqual(["Fireball"]);
	});

	it("matches sources", () => {
		expect(filterSelection(entities, "xge", meta).map(entity => entity.name)).toEqual(["Ice Knife"]);
	});

	it("matches page metadata", () => {
		expect(filterSelection(entities, "level 1", meta).map(entity => entity.name)).toEqual(["Cure Wounds", "Ice Knife"]);
	});

	it("returns the whole selection for an empty query", () => {
		expect(filterSelection(entities, "", meta)).toHaveLength(3);
		expect(filterSelection(entities, "   ", meta)).toHaveLength(3);
	});

	it("returns no matches for an unknown query", () => {
		expect(filterSelection(entities, "wish", meta)).toEqual([]);
		expect(selectionMatches(entities[0], "wish", meta)).toBe(false);
		expect(selectionMatches(entities[0], "fireball", meta)).toBe(true);
	});
});
