import {
	MIN_FONT_PT,
	bucketOf,
	chooseFlow,
	fillPanels,
	fillWithEllipsis,
	layoutPanels,
	maxPanels,
	panelRole,
	segmentSections,
	shrinkFloor,
	sizeSteps,
	stripWidth,
	textFlow,
} from "../../js/card-tool-flow.js";

const LANDSCAPE = {rows: 2, columns: 4, orientation: "landscape"};
const PORTRAIT = {rows: 2, columns: 2, orientation: "portrait"};

const units = count => Array.from({length: count}, (_, index) => index);
const capacity = limit => candidate => candidate.length <= limit;

const spy = implementation => {
	const calls = [];
	const fn = (...args) => {
		calls.push(args);
		return implementation(...args);
	};
	fn.mock = {calls};
	return fn;
};

const section = (title, words) => [title, [{name: title, entries: [words]}]];

const wordCount = candidateSections => candidateSections.reduce((total, [, entries]) => total
	+ entries.reduce((sum, entry) => sum + String(entry.entries).split(/\s+/).filter(Boolean).length, 0), 0);
const budget = limit => candidateSections => wordCount(candidateSections) <= limit;

describe("card tool flow ladder", () => {
	it("derives page caps from the grid width", () => {
		expect(maxPanels(LANDSCAPE)).toBe(5);
		expect(maxPanels(PORTRAIT)).toBe(3);
		expect(maxPanels({rows: 2, columns: 3})).toBe(3);
	});

	it("floors shrinking at the minimum point size", () => {
		expect(shrinkFloor(9.8)).toBeCloseTo(8.9, 5);
		expect(shrinkFloor(11)).toBeCloseTo(9.9, 5);
		expect(MIN_FONT_PT).toBe(8.9);
	});

	it("steps down from the default size to the floor", () => {
		const steps = sizeSteps(9.8);
		expect(steps[0]).toBe(9.8);
		expect(steps.at(-1)).toBe(8.9);
		expect(steps).toContain(9.65);
		expect(steps.every((value, index) => index === 0 || value < steps[index - 1])).toBe(true);

		const beastSteps = sizeSteps(11);
		expect(beastSteps[0]).toBe(11);
		expect(beastSteps.at(-1)).toBe(9.9);
	});

	it("maps spans to panel widths and buckets", () => {
		expect([1, 2, 3, 4, 5].map(span => stripWidth(span, 4))).toEqual([1, 2, 2, 4, 4]);
		expect([1, 2, 3, 4, 5].map(span => stripWidth(span, 2))).toEqual([1, 2, 2, 2, 2]);
		expect(bucketOf(3, false)).toBe("3");
		expect(bucketOf(5, true)).toBe("truncated");
		expect([0, 1, 2, 3, 4].map(index => panelRole(5, index))).toEqual(["first", "middle", "middle", "middle", "last"]);
		expect(panelRole(1, 0)).toBe("only");
	});
});

describe("fillPanels", () => {
	it("fills panels in order and reports completion", () => {
		const result = fillPanels(units(7), 3, capacity(3));

		expect(result.panels.map(panel => panel.units.length)).toEqual([3, 3, 1]);
		expect(result.panels.map(panel => panel.ellipsis)).toEqual([false, false, false]);
		expect(result.consumed).toBe(7);
		expect(result.complete).toBe(true);
	});

	it("leaves panels empty when the content runs out", () => {
		const result = fillPanels(units(2), 3, capacity(3));

		expect(result.panels.map(panel => panel.units.length)).toEqual([2, 0, 0]);
		expect(result.complete).toBe(true);
	});

	it("reports an incomplete fill when units remain", () => {
		const result = fillPanels(units(10), 3, capacity(3));

		expect(result.panels.map(panel => panel.units.length)).toEqual([3, 3, 3]);
		expect(result.consumed).toBe(9);
		expect(result.complete).toBe(false);
	});

	it("stops when the current size cannot fit any unit", () => {
		const result = fillPanels(units(3), 3, () => false);

		expect(result.panels.map(panel => panel.units.length)).toEqual([0, 0, 0]);
		expect(result.complete).toBe(false);
	});
});

describe("fillWithEllipsis", () => {
	it("fills the largest prefix that still fits with a marker", () => {
		const result = fillWithEllipsis(units(10), capacity(4));

		expect(result.units).toEqual([0, 1, 2, 3]);
		expect(result.consumed).toBe(4);
		expect(result.complete).toBe(false);
	});

	it("reports completion when everything fits", () => {
		const result = fillWithEllipsis(units(2), capacity(4));

		expect(result.units).toEqual([0, 1]);
		expect(result.complete).toBe(true);
	});
});

describe("layoutPanels", () => {
	it("keeps the head panels and truncates only the last one", () => {
		const result = layoutPanels(units(10), 2, capacity(3), true);

		expect(result.panels.map(panel => panel.units.length)).toEqual([3, 3]);
		expect(result.panels.map(panel => panel.ellipsis)).toEqual([false, true]);
		expect(result.consumed).toBe(6);
		expect(result.complete).toBe(false);
	});

	it("does not truncate when the content already fits", () => {
		const result = layoutPanels(units(4), 2, capacity(3), true);

		expect(result.panels.map(panel => panel.ellipsis)).toEqual([false, false]);
		expect(result.complete).toBe(true);
	});
});

describe("chooseFlow", () => {
	it("uses one card at the default size when single-mode content fits", () => {
		const layout = spy(() => ({panels: [{}], consumed: 1, complete: true}));

		const result = chooseFlow({mode: "single", page: LANDSCAPE, defaultPt: 9.8, layout});

		expect(result).toMatchObject({span: 1, fontPt: 9.8, truncated: false});
		expect(layout.mock.calls).toEqual([[1, 9.8, false]]);
	});

	it("shrinks single-mode content to the largest size that fits", () => {
		const layout = spy((span, fontPt) => ({panels: [{}], consumed: 1, complete: fontPt <= 9.65}));

		const result = chooseFlow({mode: "single", page: LANDSCAPE, defaultPt: 9.8, layout});

		expect(result).toMatchObject({span: 1, fontPt: 9.65, truncated: false});
	});

	it("truncates single-mode content at the floor", () => {
		const layout = spy(() => ({panels: [{}], consumed: 1, complete: false}));

		const result = chooseFlow({mode: "single", page: LANDSCAPE, defaultPt: 9.8, layout});

		expect(result).toMatchObject({span: 1, fontPt: 8.9, truncated: true});
		expect(layout.mock.calls.at(-1)).toEqual([1, 8.9, true]);
	});

	it("prefers the shortest overflow strip that fits", () => {
		const layout = spy((span, fontPt) => ({panels: [], consumed: 0, complete: span >= 2 && fontPt === 9.8}));

		const result = chooseFlow({mode: "overflow", page: LANDSCAPE, defaultPt: 9.8, layout});

		expect(result).toMatchObject({span: 2, fontPt: 9.8, truncated: false});
		expect(layout.mock.calls.filter(([span]) => span === 2)).toEqual([[2, 9.8, false]]);
	});

	it("only shrinks on boundary spans", () => {
		const layout = spy((span, fontPt) => ({panels: [], consumed: 0, complete: span >= 3 && fontPt <= 9.5}));

		const result = chooseFlow({mode: "overflow", page: LANDSCAPE, defaultPt: 9.8, layout});

		expect(result).toMatchObject({span: 3, fontPt: 9.5, truncated: false});
		expect(layout.mock.calls.filter(([span]) => span === 2)).toEqual([[2, 9.8, false]]);
	});

	it("truncates at the page cap", () => {
		const landscapeLayout = spy(() => ({panels: [], consumed: 0, complete: false}));
		const portraitLayout = spy(() => ({panels: [], consumed: 0, complete: false}));

		expect(chooseFlow({mode: "overflow", page: LANDSCAPE, defaultPt: 9.8, layout: landscapeLayout}))
			.toMatchObject({span: 5, truncated: true});
		expect(chooseFlow({mode: "overflow", page: PORTRAIT, defaultPt: 9.8, layout: portraitLayout}))
			.toMatchObject({span: 3, truncated: true});
		expect(portraitLayout.mock.calls.at(-1)).toEqual([3, 8.9, true]);
	});
});

describe("textFlow", () => {
	const renderPanel = (panelUnits, {ellipsis}) => `<p>${panelUnits.length}${ellipsis ? "…" : ""}</p>`;
	const measure = html => Number(html.replace(/\D+/g, "")) <= 3;

	it("returns one panel and the single bucket in single mode", () => {
		const strip = textFlow({units: units(10), mode: "single", page: LANDSCAPE, defaultPt: 9.8, measure, renderPanel});

		expect(strip.span).toBe(1);
		expect(strip.bucket).toBe("1");
		expect(strip.width).toBe(1);
		expect(strip.truncated).toBe(true);
		expect(strip.panels).toHaveLength(1);
		expect(strip.panels[0].ellipsis).toBe(true);
	});

	it("numbers overflow buckets by span and marks continuation panels", () => {
		const strip = textFlow({units: units(7), mode: "overflow", page: LANDSCAPE, defaultPt: 9.8, measure, renderPanel});

		expect(strip.span).toBe(3);
		expect(strip.bucket).toBe("3");
		expect(strip.width).toBe(2);
		expect(strip.panels.map(panel => panel.role)).toEqual(["first", "middle", "last"]);
		expect(strip.panels.map(panel => panel.continuation)).toEqual([false, true, true]);
	});

	it("requires a measure function", () => {
		expect(() => textFlow({units: [], mode: "single", page: LANDSCAPE, defaultPt: 9.8, renderPanel}))
			.toThrow(/measure/i);
	});
});

describe("segmentSections", () => {
	const fiveWords = "one two three four five";

	it("keeps everything in one segment when it fits", () => {
		const result = segmentSections(
			[section("Traits", "one two three"), section("Actions", "four five six")],
			budget(10),
		);

		expect(result.segments).toHaveLength(1);
		expect(result.segments[0].map(([title]) => title)).toEqual(["Traits", "Actions"]);
		expect(result.truncated).toBe(false);
	});

	it("splits four sections into three segments and flags truncation at the cap", () => {
		const sections = ["Traits", "Actions", "Reactions", "Legendary"].map(title => section(title, fiveWords));
		const result = segmentSections(sections, budget(5), {maxPanels: 3});

		expect(result.segments).toHaveLength(3);
		expect(result.segments.map(segment => segment.map(([title]) => title))).toEqual([
			["Traits"],
			["Actions"],
			["Reactions"],
		]);
		expect(result.truncated).toBe(true);
	});

	it("marks the last retained entry with an ellipsis", () => {
		const sections = ["Traits", "Actions", "Reactions", "Legendary"].map(title => section(title, fiveWords));
		const result = segmentSections(sections, budget(5), {maxPanels: 3, ellipsis: true});

		const lastSegment = result.segments.at(-1);
		const lastEntry = lastSegment.at(-1)[1].at(-1);
		expect(lastEntry.entries[0].endsWith("…")).toBe(true);
		expect(lastEntry.entries[0].split(/\s+/).length).toBeLessThanOrEqual(5);
	});

	it("returns one empty segment for empty input", () => {
		const result = segmentSections([], budget(5));

		expect(result.segments).toEqual([[]]);
		expect(result.truncated).toBe(false);
	});

	it("continues a section across a split instead of dropping its title", () => {
		const sections = [section("Traits", "one two three four five six")];
		const result = segmentSections(sections, budget(3), {maxPanels: 5});

		expect(result.segments.length).toBeGreaterThan(1);
		expect(result.segments.every(segment => segment[0][0] === "Traits")).toBe(true);
		expect(result.truncated).toBe(false);
	});
});
