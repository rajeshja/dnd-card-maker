import {buildPagePlan} from "../../js/card-tool-pages.js";

const LANDSCAPE = {rows: 2, columns: 4};
const PORTRAIT = {rows: 2, columns: 2};

const widthForSpan = span => span <= 2 ? span : span === 3 ? 2 : 4;

let stripSequence = 0;
const strip = (name, {span = 1, bucket = String(span), truncated = false, width = widthForSpan(span)} = {}) => {
	stripSequence++;
	return {
		entity: {name},
		span,
		width,
		bucket,
		truncated,
		fontPt: 9.8,
		panels: Array.from({length: span}, (_, index) => ({
			index,
			role: span === 1 ? "only" : index === 0 ? "first" : index === span - 1 ? "last" : "middle",
			html: `<card>${name}:${index + 1}</card>`,
			continuation: index > 0,
		})),
		id: stripSequence,
	};
};

const occupied = entry => entry.cells.filter(Boolean);
const cellNames = entry => entry.cells.map(cell => cell?.strip.entity.name ?? null);
const uniqueStripNames = entry => [...new Set(occupied(entry).map(cell => cell.strip.entity.name))];
const uniqueStrips = entry => new Set(occupied(entry).map(cell => cell.strip)).size;
const guides = entry => entry.cells.map(cell => cell?.guides ?? null);
const backCellsOf = (entry, name) => occupied(entry)
	.filter(cell => cell.strip.entity.name === name)
	.map(cell => ({panelIndex: cell.panelIndex, back: cell.back}))
	.sort((left, right) => left.panelIndex - right.panelIndex);

describe("buildPagePlan", () => {
	it("maps one-panel strips to exactly one occupied cell each", () => {
		const plan = buildPagePlan([strip("Card 1")], LANDSCAPE, "fronts");

		expect(plan).toHaveLength(1);
		expect(plan[0].side).toBe("front");
		expect(plan[0].sheetIndex).toBe(1);
		expect(plan[0].bucket).toBe("1");
		expect(plan[0].cells).toHaveLength(8);
		expect(occupied(plan[0])).toHaveLength(1);
		expect(plan[0].cells[0]).toMatchObject({panelIndex: 0, back: null});
		expect(plan[0].cells[0].strip.entity.name).toBe("Card 1");
	});

	it.each([
		[1, 8],
		[2, 4],
		[3, 4],
		[4, 2],
		[5, 2],
	])("packs span %i strips %i per 4x2 sheet", (span, perSheet) => {
		const strips = Array.from({length: 10}, (_, index) => strip(`Span ${span} ${index}`, {span}));
		const plan = buildPagePlan(strips, LANDSCAPE, "fronts");

		expect(uniqueStrips(plan[0])).toBe(perSheet);
		expect(plan).toHaveLength(Math.ceil(10 / perSheet));
		expect(plan.every(entry => uniqueStrips(entry) <= perSheet)).toBe(true);
	});

	it.each([
		[1, 4],
		[2, 2],
		[3, 2],
	])("packs span %i strips %i per 2x2 sheet", (span, perSheet) => {
		const strips = Array.from({length: 6}, (_, index) => strip(`Portrait ${span} ${index}`, {span}));
		const plan = buildPagePlan(strips, PORTRAIT, "fronts");

		expect(uniqueStrips(plan[0])).toBe(perSheet);
		expect(plan).toHaveLength(Math.ceil(6 / perSheet));
		expect(plan.every(entry => entry.cells.length === 4)).toBe(true);
	});

	it("orders buckets and starts each bucket on a fresh sheet", () => {
		const strips = [
			strip("Five", {span: 5}),
			strip("One", {span: 1}),
			strip("Two", {span: 2}),
			strip("Three", {span: 3}),
		];
		const plan = buildPagePlan(strips, LANDSCAPE, "fronts");

		expect(plan.map(entry => entry.bucket)).toEqual(["1", "2", "3", "5"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 2, 3, 4]);
		expect(plan.map(entry => uniqueStripNames(entry))).toEqual([["One"], ["Two"], ["Three"], ["Five"]]);
	});

	it("keeps sheet indexes continuous across multi-sheet buckets", () => {
		const strips = [
			...Array.from({length: 10}, (_, index) => strip(`One ${index}`, {span: 1})),
			...Array.from({length: 4}, (_, index) => strip(`Two ${index}`, {span: 2})),
			strip("Big", {span: 5, bucket: "truncated", truncated: true}),
		];
		const plan = buildPagePlan(strips, LANDSCAPE, "fronts");

		expect(plan.map(entry => entry.bucket)).toEqual(["1", "1", "2", "truncated"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 2, 3, 4]);
	});

	it("pads the last sheet of a bucket without starting another bucket on it", () => {
		const strips = [strip("One", {span: 1}), strip("Two", {span: 2})];
		const plan = buildPagePlan(strips, LANDSCAPE, "fronts");

		expect(plan[0].cells.filter(Boolean)).toHaveLength(1);
		expect(plan[0].cells.slice(1)).toEqual(new Array(7).fill(null));
		expect(plan[1].cells.filter(Boolean)).toHaveLength(2);
		expect(plan[1].cells.slice(2)).toEqual(new Array(6).fill(null));
	});

	it("emits only mirrored back pages in the backs layout", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D")], LANDSCAPE, "backs");

		expect(plan).toHaveLength(1);
		expect(plan[0].side).toBe("back");
		expect(cellNames(plan[0])).toEqual(["D", "C", "B", "A", null, null, null, null]);
	});

	it("interleaves paired front and back pages in the both layout", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D")], LANDSCAPE, "both");

		expect(plan.map(entry => entry.side)).toEqual(["front", "back"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 1]);
		expect(plan.map(entry => entry.bucket)).toEqual(["1", "1"]);
	});

	it("mirrors each row of a 4x2 back page", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D"), strip("E"), strip("F"), strip("G"), strip("H")], LANDSCAPE, "backs");

		expect(cellNames(plan[0])).toEqual(["D", "C", "B", "A", "H", "G", "F", "E"]);
	});

	it("mirrors each row of a 2x2 back page", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C"), strip("D")], PORTRAIT, "backs");

		expect(cellNames(plan[0])).toEqual(["B", "A", "D", "C"]);
	});

	it("keeps padding null on both sides of a partial sheet", () => {
		const plan = buildPagePlan([strip("A"), strip("B"), strip("C")], PORTRAIT, "both");

		expect(cellNames(plan[0])).toEqual(["A", "B", "C", null]);
		expect(cellNames(plan[1])).toEqual(["B", "A", null, "C"]);
		expect(plan[1].cells[2]).toBeNull();
	});

	describe("per-panel back roles", () => {
		it("puts art behind every panel of a one-panel strip", () => {
			const plan = buildPagePlan([strip("A", {span: 1})], LANDSCAPE, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([{panelIndex: 0, back: "art"}]);
		});

		it("puts art behind both panels of a two-page strip", () => {
			const plan = buildPagePlan([strip("A", {span: 2})], LANDSCAPE, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([{panelIndex: 0, back: "art"}, {panelIndex: 1, back: "art"}]);
		});

		it("puts page three on the back of the second panel of a three-page strip", () => {
			const plan = buildPagePlan([strip("A", {span: 3})], LANDSCAPE, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([{panelIndex: 0, back: "art"}, {panelIndex: 2, back: "page"}]);
			expect(plan[1].cells[2]).toMatchObject({panelIndex: 2, back: "page"});
		});

		it("leaves the first two accordion backs blank and puts art behind the fourth panel", () => {
			const plan = buildPagePlan([strip("A", {span: 4})], LANDSCAPE, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([
				{panelIndex: 0, back: "art"},
				{panelIndex: 1, back: "blank"},
				{panelIndex: 2, back: "blank"},
				{panelIndex: 3, back: "art"},
			]);
			expect(plan[1].cells.slice(0, 4).every(cell => cell !== null)).toBe(true);
		});

		it("puts page five on the back of the fourth panel of a five-page strip", () => {
			const plan = buildPagePlan([strip("A", {span: 5})], LANDSCAPE, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([
				{panelIndex: 0, back: "art"},
				{panelIndex: 1, back: "blank"},
				{panelIndex: 2, back: "blank"},
				{panelIndex: 4, back: "page"},
			]);
			expect(plan[1].cells[0]).toMatchObject({panelIndex: 4, back: "page"});
		});

		it("mirrors three-panel backs on a 2x2 page", () => {
			const plan = buildPagePlan([strip("A", {span: 3})], PORTRAIT, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([{panelIndex: 0, back: "art"}, {panelIndex: 2, back: "page"}]);
			expect(plan[1].cells[0]).toMatchObject({panelIndex: 2, back: "page"});
		});

		it("mirrors two-panel backs on a 2x2 page", () => {
			const plan = buildPagePlan([strip("A", {span: 2})], PORTRAIT, "both");
			expect(backCellsOf(plan[1], "A")).toEqual([{panelIndex: 0, back: "art"}, {panelIndex: 1, back: "art"}]);
		});
	});

	describe("cut and fold guides", () => {
		it("folds inside each two-panel strip and cuts between strips and rows", () => {
			const strips = [strip("A", {span: 2}), strip("B", {span: 2}), strip("C", {span: 2}), strip("D", {span: 2})];
			const plan = buildPagePlan(strips, LANDSCAPE, "fronts");
			const rowGuides = guides(plan[0]);

			expect(rowGuides.slice(0, 4)).toEqual([
				{right: "fold", bottom: "cut"},
				{right: "cut", bottom: "cut"},
				{right: "fold", bottom: "cut"},
				{right: null, bottom: "cut"},
			]);
			expect(rowGuides.slice(4, 8).map(guide => guide.right)).toEqual(["fold", "cut", "fold", null]);
			expect(rowGuides.slice(4, 8).map(guide => guide.bottom)).toEqual([null, null, null, null]);
		});

		it("shows three folds and no interior horizontal cut on a four-panel accordion sheet", () => {
			const plan = buildPagePlan([strip("A", {span: 4}), strip("B", {span: 4})], LANDSCAPE, "fronts");
			const sheetGuides = guides(plan[0]);

			expect(sheetGuides.slice(0, 4).map(guide => guide.right)).toEqual(["fold", "fold", "fold", null]);
			expect(sheetGuides.slice(0, 4).map(guide => guide.bottom)).toEqual(["cut", "cut", "cut", "cut"]);
			expect(sheetGuides.slice(4, 8).map(guide => guide.bottom)).toEqual([null, null, null, null]);
			expect(sheetGuides.filter(guide => guide?.bottom === "fold")).toHaveLength(0);
		});

		it("only cuts between single-panel cards", () => {
			const strips = [strip("A"), strip("B"), strip("C"), strip("D")];
			const plan = buildPagePlan(strips, LANDSCAPE, "fronts");
			const sheetGuides = guides(plan[0]);

			expect(sheetGuides.slice(0, 4).map(guide => guide.right)).toEqual(["cut", "cut", "cut", null]);
			expect(sheetGuides.filter(guide => guide?.right === "fold")).toHaveLength(0);
		});

		it("mirrors guide roles onto the paired back page", () => {
			const strips = [strip("A", {span: 2}), strip("B", {span: 2}), strip("C", {span: 2}), strip("D", {span: 2})];
			const plan = buildPagePlan(strips, LANDSCAPE, "both");
			const front = guides(plan[0]);
			const back = guides(plan[1]);

			expect(back.map(guide => guide.right)).toEqual(front.map(guide => guide.right));
			expect(back.map(guide => guide.bottom)).toEqual(front.map(guide => guide.bottom));
		});

		it("leaves padding cells without guides", () => {
			const plan = buildPagePlan([strip("A")], LANDSCAPE, "fronts");

			expect(plan[0].cells[0].guides).toEqual({right: "cut", bottom: null});
			expect(plan[0].cells.slice(1)).toEqual(new Array(7).fill(null));
		});
	});

	it("skips empty buckets and returns an empty plan for no strips", () => {
		expect(buildPagePlan([], LANDSCAPE, "both")).toEqual([]);
		expect(buildPagePlan(null, LANDSCAPE, "both")).toEqual([]);
	});

	it("falls back to fronts for an unknown layout", () => {
		const plan = buildPagePlan([strip("A"), strip("B")], LANDSCAPE, "sideways");

		expect(plan).toHaveLength(1);
		expect(plan[0].side).toBe("front");
		expect(cellNames(plan[0])).toEqual(["A", "B", null, null, null, null, null, null]);
	});
});
