import {
	DEFAULT_FIT,
	itemFlow,
	itemUnits,
	lineHeightFor,
	renderUnits,
	sentenceUnits,
	spellFlow,
	spellPanel,
	spellUnits,
	wordUnits,
} from "../../js/card-tool-content.js";

const LANDSCAPE = {rows: 2, columns: 4, orientation: "landscape"};

const spell = (entries, extra = {}) => ({
	name: "Test Spell",
	school: "V",
	level: 3,
	source: "PHB",
	entries,
	time: [{number: 1, unit: "action"}],
	range: {type: "point", distance: {type: "60 feet"}},
	duration: [{type: "timed", duration: {amount: 1, type: "minute"}, concentration: true}],
	components: {v: true, s: true},
	...extra,
});

const sentences = count => Array.from({length: count}, (_, index) => `Sentence ${index + 1} is here.`).join(" ");

const paragraphCount = html => (html.match(/<p>/g) || []).length;
const wordCount = html => (html.replace(/<[^>]*>/g, " ").match(/\S+/g) || []).length;

describe("content units", () => {
	it("splits text into sentence units with ordered block ids", () => {
		const units = sentenceUnits("One thing. Two things! Three?");

		expect(units.map(unit => unit.text)).toEqual(["One thing.", "Two things!", "Three?"]);
		expect(units.map(unit => unit.block)).toEqual([0, 1, 2]);
		expect(units.every(unit => unit.kind === "text")).toBe(true);
	});

	it("splits an oversized unit into words that keep their block", () => {
		const words = wordUnits({block: 4, kind: "text", text: "alpha beta gamma"});

		expect(words.map(unit => unit.text)).toEqual(["alpha", "beta", "gamma"]);
		expect(words.every(unit => unit.block === 4)).toBe(true);
	});

	it("flattens spell tags and appends a material component unit", () => {
		const units = spellUnits(spell(["Deal {@damage 8d6} fire damage."], {components: {v: true, m: "a tiny ball of bat guano"}}));

		expect(units[0].text).toBe("Deal 8d6 fire damage.");
		expect(units.at(-1)).toMatchObject({kind: "material", text: "a tiny ball of bat guano"});
	});

	it("reads item entries into sentence units", () => {
		const units = itemUnits({entries: ["First sentence.", "Second sentence."]});

		expect(units.map(unit => unit.text)).toEqual(["First sentence.", "Second sentence."]);
	});

	it("returns no units for empty entries", () => {
		expect(itemUnits({})).toEqual([]);
		expect(spellUnits({})).toEqual([]);
	});
});

describe("renderUnits", () => {
	it("groups sentences that share a block into one paragraph", () => {
		const html = renderUnits([
			{block: 0, kind: "text", text: "First part."},
			{block: 0, kind: "text", text: "Second part."},
			{block: 1, kind: "text", text: "New paragraph."},
		]);

		expect(html).toBe("<p>First part. Second part.</p><p>New paragraph.</p>");
	});

	it("escapes untrusted text", () => {
		const html = renderUnits([{block: 0, kind: "text", text: "R&D <script>"}]);

		expect(html).toBe("<p>R&amp;D &lt;script&gt;</p>");
	});

	it("renders a material component block", () => {
		const html = renderUnits([{block: 0, kind: "material", text: "a bit of fleece"}]);

		expect(html).toContain("material-component");
		expect(html).toContain("<strong>M:</strong> a bit of fleece");
	});

	it("marks the last block with an ellipsis marker", () => {
		const html = renderUnits([
			{block: 0, kind: "text", text: "Kept."},
			{block: 1, kind: "text", text: "Cut."},
		], {ellipsis: true});
		const paragraphs = html.split("</p>");

		expect(paragraphs[0]).not.toContain("card-ellipsis");
		expect(paragraphs[1]).toContain("card-ellipsis");
	});

	it("renders a bare marker when there is nothing left to show", () => {
		const html = renderUnits([], {ellipsis: true});

		expect(html).toContain("card-ellipsis");
	});
});

describe("lineHeightFor", () => {
	it("interpolates between the default and minimum line height", () => {
		expect(lineHeightFor(9.8, 9.8, 8.9)).toBe(1.3);
		expect(lineHeightFor(8.9, 9.8, 8.9)).toBe(1.2);
		expect(lineHeightFor(9.35, 9.8, 8.9)).toBe(1.25);
	});
});

describe("spellPanel", () => {
	it("drops the meta block on continuation panels", () => {
		const first = spellPanel(spell([]), [], {title: "Test Spell", metaHtml: "<div class=\"spell-meta\">META</div>"});
		const next = spellPanel(spell([]), [], {title: "Test Spell", metaHtml: "<div class=\"spell-meta\">META</div>", continuation: true});

		expect(first).toContain("META");
		expect(next).not.toContain("META");
		expect(next).toContain("contd.");
		expect(next).toContain('data-content-pt="9.8"');
	});
});

describe("spellFlow", () => {
	const measureByParagraph = max => html => paragraphCount(html) <= max;

	it("keeps a short spell on one card", () => {
		const flow = spellFlow(spell([sentences(2)]), {
			mode: "overflow",
			page: LANDSCAPE,
			measure: measureByParagraph(3),
		});

		expect(flow.span).toBe(1);
		expect(flow.bucket).toBe("1");
		expect(flow.truncated).toBe(false);
		expect(flow.panels).toHaveLength(1);
	});

	it("spreads a long spell across panels with continuation panels", () => {
		const flow = spellFlow(spell([sentences(10)]), {
			mode: "overflow",
			page: LANDSCAPE,
			measure: measureByParagraph(3),
		});

		expect(flow.span).toBe(4);
		expect(flow.bucket).toBe("4");
		expect(flow.width).toBe(4);
		expect(flow.panels.map(panel => panel.continuation)).toEqual([false, true, true, true]);
		expect(flow.panels[0].html).toContain("spell-meta");
		expect(flow.panels[1].html).not.toContain("spell-meta");
		expect(flow.panels[1].html).toContain("contd.");
	});

	it("shrinks at a boundary span before adding another panel", () => {
		const measure = html => paragraphCount(html) <= (html.includes('data-content-pt="9.8"') ? 2 : 3);
		const flow = spellFlow(spell([sentences(9)]), {mode: "overflow", page: LANDSCAPE, measure});

		expect(flow.span).toBe(3);
		expect(flow.fontPt).toBeCloseTo(9.65, 5);
	});

	it("forces single mode onto one card in bucket 1 with an ellipsis", () => {
		const flow = spellFlow(spell([sentences(20)]), {
			mode: "single",
			page: LANDSCAPE,
			measure: measureByParagraph(3),
		});

		expect(flow.span).toBe(1);
		expect(flow.bucket).toBe("1");
		expect(flow.truncated).toBe(true);
		expect(flow.panels).toHaveLength(1);
		expect(flow.panels[0].html).toContain("card-ellipsis");
	});
});

describe("itemFlow", () => {
	it("keeps a short item on one card", () => {
		const flow = itemFlow({name: "Dagger", type: "M", entries: ["A small blade."]}, {
			mode: "overflow",
			page: LANDSCAPE,
			measure: html => wordCount(html) <= 6,
		});

		expect(flow.span).toBe(1);
		expect(flow.panels[0].html).toContain("Dagger");
	});

	it("breaks an oversized sentence into words instead of looping forever", () => {
		const words = Array.from({length: 24}, (_, index) => `word${index + 1}`).join(" ");
		const flow = itemFlow({name: "Long Scroll", type: "SC", entries: [`${words}.`]}, {
			mode: "overflow",
			page: LANDSCAPE,
			measure: html => wordCount(html) <= 10,
		});

		expect(flow.span).toBeGreaterThan(1);
		expect(flow.truncated).toBe(false);
		expect(flow.panels.map(panel => panel.continuation)[0]).toBe(false);
		expect(flow.panels.slice(1).every(panel => panel.continuation)).toBe(true);
	});

	it("truncates a single-mode item into bucket 1", () => {
		const words = Array.from({length: 30}, (_, index) => `word${index + 1}`).join(" ");
		const flow = itemFlow({name: "Long Scroll", type: "SC", entries: [`${words}.`]}, {
			mode: "single",
			page: LANDSCAPE,
			measure: html => wordCount(html) <= 10,
		});

		expect(flow.span).toBe(1);
		expect(flow.bucket).toBe("1");
		expect(flow.truncated).toBe(true);
		expect(flow.panels[0].html).toContain("card-ellipsis");
	});
});

describe("default fit", () => {
	it("matches the shared description fit values", () => {
		expect(DEFAULT_FIT.defaultPt).toBe(9.8);
		expect(DEFAULT_FIT.minPt).toBe(8.9);
		expect(DEFAULT_FIT.stepPt).toBe(0.15);
	});
});
