import {readFileSync} from "node:fs";
import {resolveSpellClasses, spellClassLabel} from "../../js/card-tool-content.js";

const LOOKUP = JSON.parse(readFileSync(new URL("../../5etools/data/generated/gendata-spell-source-lookup.json", import.meta.url), "utf8"));
const entryOf = (source, name) => LOOKUP[source.toLowerCase()]?.[name.toLowerCase()];

// Mirrors the derived `_classes` field that `prepareSpells()` attaches in js/spell-cards.js.
const chipClasses = entry => {
	const {classes, grants} = resolveSpellClasses(entry);
	return classes.length ? classes : grants.map(grant => grant.className);
};

const alphabetical = values => [...values].sort((left, right) => left.localeCompare(right));

describe("spell class resolution", () => {
	it("uses the base class list for Fireball", () => {
		const fireball = entryOf("XPHB", "Fireball");

		expect(resolveSpellClasses(fireball).classes).toEqual(["Sorcerer", "Wizard"]);
		expect(spellClassLabel(fireball)).toEqual({text: "Sorcerer, Wizard", singular: false});
	});

	it("sorts Detect Magic XPHB's nine classes alphabetically", () => {
		const detectMagic = entryOf("XPHB", "Detect Magic");
		const {classes} = resolveSpellClasses(detectMagic);

		expect(classes).toHaveLength(9);
		expect(classes).toEqual(alphabetical(classes));
		expect(classes).toEqual(["Artificer", "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"]);
		expect(spellClassLabel(detectMagic).text).toBe("Artificer, Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard");
	});

	it("groups subclass-only grants under their owning class", () => {
		const magnifyGravity = entryOf("EGW", "Magnify Gravity");

		expect(resolveSpellClasses(magnifyGravity)).toEqual({
			classes: [],
			grants: [{className: "Wizard", subclasses: ["Chronurgy", "Graviturgy"]}],
		});
		expect(spellClassLabel(magnifyGravity)).toEqual({text: "Wizard (Chronurgy, Graviturgy)", singular: true});
	});

	it("lists both owning classes for Sapping Sting", () => {
		const sappingSting = entryOf("EGW", "Sapping Sting");

		expect(resolveSpellClasses(sappingSting).grants).toEqual([
			{className: "Cleric", subclasses: ["Death"]},
			{className: "Wizard", subclasses: ["Chronurgy", "Graviturgy"]},
		]);
		expect(spellClassLabel(sappingSting)).toEqual({
			text: "Cleric (Death), Wizard (Chronurgy, Graviturgy)",
			singular: false,
		});
	});

	it("falls back to an em dash when a spell has no class or subclass grant", () => {
		const encodeThoughts = entryOf("GGR", "Encode Thoughts");

		expect(resolveSpellClasses(encodeThoughts)).toEqual({classes: [], grants: []});
		expect(spellClassLabel(encodeThoughts)).toEqual({text: "—", singular: false});
	});

	it("collapses a subclass granted through both the 2014 and 2024 entries", () => {
		const duplicate = {
			subclass: {
				PHB: {Wizard: {EGW: {Chronurgy: {name: "Chronurgy Magic"}}}},
				XPHB: {Wizard: {EGW: {Chronurgy: {name: "Chronurgy Magic"}}}},
			},
		};

		expect(resolveSpellClasses(duplicate).grants).toEqual([{className: "Wizard", subclasses: ["Chronurgy"]}]);
		expect(spellClassLabel(duplicate).text).toBe("Wizard (Chronurgy)");
		expect(spellClassLabel(duplicate).singular).toBe(true);
	});

	it("collapses edition twins and sorts bases regardless of data order", () => {
		const twin = {
			class: {PHB: {Wizard: true, Bard: true}, XPHB: {Wizard: true}},
			classVariant: {PHB: {Cleric: {definedInSources: ["TCE"]}}},
		};

		expect(resolveSpellClasses(twin).classes).toEqual(["Bard", "Cleric", "Wizard"]);
		expect(spellClassLabel(twin).text).toBe("Bard, Cleric, Wizard");
	});

	it("treats a missing lookup entry as no class data", () => {
		expect(resolveSpellClasses(undefined)).toEqual({classes: [], grants: []});
		expect(spellClassLabel(undefined)).toEqual({text: "—", singular: false});
	});
});

describe("class filter membership", () => {
	it("keeps a base-class spell's list unchanged and ignores its subclass grants", () => {
		const fireball = entryOf("XPHB", "Fireball");

		expect(chipClasses(fireball)).toEqual(["Sorcerer", "Wizard"]);
		expect(chipClasses(fireball)).not.toContain("Cleric");
		expect(chipClasses(fireball)).not.toContain("Warlock");
	});

	it("adds the owning class for a subclass-only spell", () => {
		expect(chipClasses(entryOf("EGW", "Magnify Gravity"))).toEqual(["Wizard"]);
	});

	it("includes both owning classes for a subclass-only spell granted twice", () => {
		expect(chipClasses(entryOf("EGW", "Sapping Sting"))).toEqual(["Cleric", "Wizard"]);
	});

	it("leaves a spell with no grant under no class chip", () => {
		expect(chipClasses(entryOf("GGR", "Encode Thoughts"))).toEqual([]);
	});
});
