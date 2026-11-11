import {buildPagePlan} from "../../js/card-tool-pages.js";

const LANDSCAPE = {rows: 2, columns: 4};
const PORTRAIT = {rows: 2, columns: 2};

const items = count => Array.from({length: count}, (_, index) => ({name: `Card ${index + 1}`}));
const names = entry => entry.cards.map(card => card?.name ?? null);
const mirrorIndex = (index, columns) => Math.floor(index / columns) * columns + (columns - 1 - (index % columns));

describe("buildPagePlan", () => {
	it("chunks items in selection order and pads the final front page", () => {
		const plan = buildPagePlan(items(10), LANDSCAPE, "fronts");

		expect(plan).toHaveLength(2);
		expect(plan.map(entry => entry.side)).toEqual(["front", "front"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 2]);
		expect(plan.every(entry => entry.cards.length === 8)).toBe(true);
		expect(names(plan[0])).toEqual(["Card 1", "Card 2", "Card 3", "Card 4", "Card 5", "Card 6", "Card 7", "Card 8"]);
		expect(names(plan[1])).toEqual(["Card 9", "Card 10", null, null, null, null, null, null]);
	});

	it("keeps full front pages unpadded and in sheet order", () => {
		const plan = buildPagePlan(items(16), LANDSCAPE, "fronts");

		expect(plan).toHaveLength(2);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 2]);
		expect(plan.every(entry => entry.cards.every(value => value !== null))).toBe(true);
		expect(names(plan[1])).toEqual(["Card 9", "Card 10", "Card 11", "Card 12", "Card 13", "Card 14", "Card 15", "Card 16"]);
	});

	it("emits only mirrored back pages in the backs layout", () => {
		const plan = buildPagePlan(items(10), LANDSCAPE, "backs");

		expect(plan).toHaveLength(2);
		expect(plan.map(entry => entry.side)).toEqual(["back", "back"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 2]);
		expect(names(plan[0])).toEqual(["Card 4", "Card 3", "Card 2", "Card 1", "Card 8", "Card 7", "Card 6", "Card 5"]);
	});

	it("mirrors each row for a 4x2 landscape page", () => {
		const plan = buildPagePlan(items(8), LANDSCAPE, "backs");

		expect(names(plan[0])).toEqual(["Card 4", "Card 3", "Card 2", "Card 1", "Card 8", "Card 7", "Card 6", "Card 5"]);
	});

	it("mirrors each row for a 2x2 portrait page", () => {
		const plan = buildPagePlan(items(4), PORTRAIT, "backs");

		expect(names(plan[0])).toEqual(["Card 2", "Card 1", "Card 4", "Card 3"]);
	});

	it("interleaves full front and back pages in the both layout", () => {
		const plan = buildPagePlan(items(16), LANDSCAPE, "both");

		expect(plan.map(entry => entry.side)).toEqual(["front", "back", "front", "back"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 1, 2, 2]);
		expect(names(plan[0])).toEqual(["Card 1", "Card 2", "Card 3", "Card 4", "Card 5", "Card 6", "Card 7", "Card 8"]);
		expect(names(plan[1])).toEqual(["Card 4", "Card 3", "Card 2", "Card 1", "Card 8", "Card 7", "Card 6", "Card 5"]);
		expect(names(plan[2])).toEqual(["Card 9", "Card 10", "Card 11", "Card 12", "Card 13", "Card 14", "Card 15", "Card 16"]);
		expect(names(plan[3])).toEqual(["Card 12", "Card 11", "Card 10", "Card 9", "Card 16", "Card 15", "Card 14", "Card 13"]);
	});

	it("keeps a partial final chunk paired and behind its own front cards", () => {
		const plan = buildPagePlan(items(10), LANDSCAPE, "both");
		const front = plan[2].cards;
		const back = plan[3].cards;

		expect(plan.map(entry => entry.side)).toEqual(["front", "back", "front", "back"]);
		expect(plan.map(entry => entry.sheetIndex)).toEqual([1, 1, 2, 2]);
		expect(names(plan[2])).toEqual(["Card 9", "Card 10", null, null, null, null, null, null]);
		expect(names(plan[3])).toEqual([null, null, "Card 10", "Card 9", null, null, null, null]);

		front.forEach((value, index) => {
			expect(back[mirrorIndex(index, LANDSCAPE.columns)]).toBe(value);
		});

		expect(front[2]).toBeNull();
		expect(back[mirrorIndex(2, LANDSCAPE.columns)]).toBeNull();
		expect(front[3]).toBeNull();
		expect(back[mirrorIndex(3, LANDSCAPE.columns)]).toBeNull();
	});

	it("leaves padded portrait positions empty on both sides", () => {
		const plan = buildPagePlan(items(3), PORTRAIT, "both");
		const front = plan[0].cards;
		const back = plan[1].cards;

		expect(names(plan[0])).toEqual(["Card 1", "Card 2", "Card 3", null]);
		expect(names(plan[1])).toEqual(["Card 2", "Card 1", null, "Card 3"]);

		front.forEach((value, index) => {
			expect(back[mirrorIndex(index, PORTRAIT.columns)]).toBe(value);
		});
	});

	it("returns an empty plan for an empty selection", () => {
		expect(buildPagePlan([], LANDSCAPE, "both")).toEqual([]);
	});

	it("falls back to fronts for an unknown layout", () => {
		const plan = buildPagePlan(items(2), LANDSCAPE, "sideways");

		expect(plan).toHaveLength(1);
		expect(plan[0].side).toBe("front");
		expect(names(plan[0])).toEqual(["Card 1", "Card 2", null, null, null, null, null, null]);
	});
});
