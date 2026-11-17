import {
	CARD_BOOK_FORMAT,
	LEGACY_SPELL_FORMAT,
	LEGACY_SPELL_KEY,
	bookKey,
	dedupeRefs,
	entityLookup,
	mergeSelectionRefs,
	normalizeBook,
	parseBook,
	readBook,
	referenceId,
	resolveCards,
} from "../../js/card-tool-cardbooks.js";

const typedBook = (cards = [
	{type: "spell", name: "Magic Missile", source: "PHB"},
	{type: "spell", name: "Shield", source: "PHB"},
], name = "Curse of Strahd") => ({format: CARD_BOOK_FORMAT, name, cards});

describe("cardbook envelope validation", () => {
	it("parses and normalises the typed envelope", () => {
		const result = parseBook(JSON.stringify(typedBook()), {pageType: "spell"});
		expect(result.ok).toBe(true);
		expect(result.book).toEqual(typedBook());
		expect(normalizeBook(typedBook(), {pageType: "spell"})).toEqual(typedBook());
	});

	it("reports malformed JSON instead of throwing", () => {
		const result = parseBook("{not json", {pageType: "spell", name: "Broken"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/not valid JSON/i);
	});

	it("reports a missing name", () => {
		const result = readBook({format: CARD_BOOK_FORMAT, cards: typedBook().cards}, {pageType: "spell"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/name/i);
		expect(normalizeBook({format: CARD_BOOK_FORMAT, cards: typedBook().cards}, {pageType: "spell"})).toBeNull();
	});

	it("reports an unknown format marker", () => {
		const result = readBook({...typedBook(), format: "5etools-cardbook-v9"}, {pageType: "spell"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/unknown format/i);
	});

	it("reports a missing card list", () => {
		const result = readBook({format: CARD_BOOK_FORMAT, name: "Empty"}, {pageType: "spell"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/card list/i);
	});

	it("reports an empty card list", () => {
		const result = readBook(typedBook([]), {pageType: "spell"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/no cards/i);
	});

	it("skips non-object references and keeps the usable ones", () => {
		const cards = [null, "Magic Missile", 7, {name: "Shield", source: "PHB", type: "spell"}, [], {name: "", source: "PHB", type: "spell"}];
		const result = readBook(typedBook(cards), {pageType: "spell"});
		expect(result.ok).toBe(true);
		expect(result.book.cards).toEqual([{type: "spell", name: "Shield", source: "PHB"}]);
	});

	it("reports a reference list with no usable entries", () => {
		const result = readBook(typedBook([null, "nope", {}]), {pageType: "spell"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/no usable card references/i);
	});

	it("names the per-type storage key", () => {
		expect(bookKey("spell")).toBe("card-tool-spell-books");
		expect(bookKey("item")).toBe("card-tool-item-books");
		expect(bookKey("beast")).toBe("card-tool-beast-books");
		expect(LEGACY_SPELL_KEY).toBe("spell-cards-spellbooks");
	});
});

describe("legacy cardbook compatibility", () => {
	it("reads a bare {name, source} array as spell references on the spell page", () => {
		const result = readBook([{name: "Magic Missile", source: "PHB"}], {pageType: "spell", name: "Old Book"});
		expect(result.ok).toBe(true);
		expect(result.legacy).toBe(true);
		expect(result.book).toEqual({
			format: CARD_BOOK_FORMAT,
			name: "Old Book",
			cards: [{type: "spell", name: "Magic Missile", source: "PHB"}],
		});
	});

	it("reads the legacy spell envelope on the spell page", () => {
		const raw = {format: LEGACY_SPELL_FORMAT, name: "Old Book", cards: [{name: "Shield", source: "PHB"}]};
		const result = readBook(raw, {pageType: "spell"});
		expect(result.ok).toBe(true);
		expect(result.legacy).toBe(true);
		expect(result.book.cards).toEqual([{type: "spell", name: "Shield", source: "PHB"}]);
	});

	it("rejects a bare array on the item and beast pages", () => {
		for (const pageType of ["item", "beast"]) {
			const result = readBook([{name: "Magic Missile", source: "PHB"}], {pageType, name: "Old Book"});
			expect(result.ok).toBe(false);
			expect(result.reason).toMatch(/spells/i);
		}
	});

	it("rejects a bare array with no name to fall back on", () => {
		const result = readBook([{name: "Magic Missile", source: "PHB"}], {pageType: "spell"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/name/i);
	});

	it("rejects an empty bare array", () => {
		const result = readBook([], {pageType: "spell", name: "Old Book"});
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/no cards/i);
	});
});

describe("cardbook resolution", () => {
	const spells = [
		{name: "Magic Missile", source: "PHB"},
		{name: "Magic Missile", source: "XPHB"},
		{name: "Shield", source: "PHB"},
		{name: "Wish", source: "PHB"},
	];

	it("uses the page type for the lookup even when entities carry their own type field", () => {
		const items = [{type: "Wondrous item", name: "Bag of Holding", source: "DMG"}];
		const lookup = entityLookup(items, "item");
		expect(lookup.has("item|Bag of Holding|DMG")).toBe(true);
		expect(lookup.has("Wondrous item|Bag of Holding|DMG")).toBe(false);
		expect(referenceId({type: "item", name: "Bag of Holding", source: "DMG"})).toBe("item|Bag of Holding|DMG");
	});

	it("resolves matched references and collects unmatched ones", () => {
		const book = typedBook([
			{type: "spell", name: "Magic Missile", source: "PHB"},
			{type: "spell", name: "Wish", source: "PHB"},
			{type: "spell", name: "Not In This Source", source: "SCAG"},
		]);
		const {resolved, unmatched} = resolveCards(book, entityLookup(spells, "spell"));
		expect(resolved.map(entity => `${entity.name}|${entity.source}`)).toEqual(["Magic Missile|PHB", "Wish|PHB"]);
		expect(unmatched).toEqual([{type: "spell", name: "Not In This Source", source: "SCAG"}]);
	});

	it("reports every reference when nothing matches", () => {
		const book = typedBook([{type: "spell", name: "Missing", source: "PHB"}]);
		const {resolved, unmatched} = resolveCards(book, entityLookup([], "spell"));
		expect(resolved).toEqual([]);
		expect(unmatched).toHaveLength(1);
	});

	it("deduplicates duplicate references before resolving", () => {
		const book = typedBook([
			{type: "spell", name: "Magic Missile", source: "PHB"},
			{type: "spell", name: "Magic Missile", source: "PHB"},
			{type: "spell", name: "Magic Missile", source: "PHB"},
		]);
		const {resolved, unmatched} = resolveCards(book, entityLookup(spells, "spell"));
		expect(resolved).toHaveLength(1);
		expect(unmatched).toEqual([]);
	});

	it("resolves the correct source when a name exists in several sources", () => {
		const book = typedBook([
			{type: "spell", name: "Magic Missile", source: "XPHB"},
			{type: "spell", name: "Magic Missile", source: "PHB"},
		]);
		const {resolved, unmatched} = resolveCards(book, entityLookup(spells, "spell"));
		expect(unmatched).toEqual([]);
		expect(resolved.map(entity => entity.source)).toEqual(["XPHB", "PHB"]);
	});

	it("merges current and resolved references without duplicates", () => {
		const current = [{type: "spell", name: "Shield", source: "PHB"}];
		const resolved = [
			{type: "spell", name: "Shield", source: "PHB"},
			{type: "spell", name: "Wish", source: "PHB"},
		];
		expect(mergeSelectionRefs(current, resolved)).toEqual([
			{type: "spell", name: "Shield", source: "PHB"},
			{type: "spell", name: "Wish", source: "PHB"},
		]);
	});

	it("deduplicates references by the stable identity", () => {
		expect(dedupeRefs([
			{type: "item", name: "Bag of Holding", source: "DMG"},
			{type: "item", name: "Bag of Holding", source: "DMG"},
			{type: "item", name: "Bag of Holding", source: "XDMG"},
		])).toHaveLength(2);
	});
});
