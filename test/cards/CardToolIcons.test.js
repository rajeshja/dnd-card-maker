import {
	ICON_IDS,
	OPTION_GROUPS,
	activeOption,
	findOption,
	hasIcon,
	iconMarkup,
	spriteMarkup,
	triggerLabel,
} from "../../js/card-tool-icons.js";

const EXPECTED = {
	content: {label: "Content mode", options: [["single", "Single card"], ["overflow", "Overflow"]]},
	layout: {label: "Card layout", options: [["fronts", "Fronts"], ["backs", "Backs"], ["both", "Both"]]},
	density: {label: "Preview density", options: [["auto", "Auto"], ["large", "Large"], ["grid", "Grid"]]},
};

describe("card tool icon registry", () => {
	it("names every option of every presentation group", () => {
		expect(Object.keys(OPTION_GROUPS)).toEqual(Object.keys(EXPECTED));
		for (const [group, expected] of Object.entries(EXPECTED)) {
			expect(OPTION_GROUPS[group].label).toBe(expected.label);
			expect(OPTION_GROUPS[group].options.map(option => [option.value, option.name])).toEqual(expected.options);
		}
	});

	it("keeps option values unique inside a group", () => {
		for (const group of Object.values(OPTION_GROUPS)) {
			const values = group.options.map(option => option.value);
			expect(new Set(values).size).toBe(values.length);
		}
	});

	it("names an icon that exists in the sprite for every option", () => {
		for (const group of Object.values(OPTION_GROUPS)) {
			for (const option of group.options) {
				expect(hasIcon(option.icon)).toBe(true);
				expect(() => iconMarkup(option.icon)).not.toThrow();
				expect(spriteMarkup()).toContain(`id="ct-icon-${option.icon}"`);
			}
		}
		expect(ICON_IDS).toEqual(expect.arrayContaining(["brand", "save", "load", "print", "debug", "browse"]));
	});

	it("rejects an icon id that is not in the sprite", () => {
		expect(() => iconMarkup("not-an-icon")).toThrow(/unknown card-tool icon/i);
		expect(hasIcon("not-an-icon")).toBe(false);
	});

	it("resolves the active option and its trigger label", () => {
		expect(activeOption("layout", "backs")).toMatchObject({value: "backs", name: "Backs", icon: "backs"});
		expect(triggerLabel("layout", "backs")).toBe("Card layout: Backs");
		expect(findOption("density", "grid")).toMatchObject({name: "Grid"});
		expect(findOption("density", "nope")).toBeNull();
		expect(activeOption("density", "nope")).toMatchObject({value: "auto"});
		expect(findOption("unknown-group", "auto")).toBeNull();
		expect(triggerLabel("unknown-group", "auto")).toBe("");
	});
});
