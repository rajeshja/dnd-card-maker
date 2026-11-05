import {flattenCardEntries, formatCardText} from "../../js/card-tool-text.js";

describe("Card tool text formatting", () => {
	it("renders tags with plain text arguments", () => {
		expect(formatCardText("Use {@spell fireball} against {@condition blinded} targets.")).toBe("Use fireball against blinded targets.");
	});

	it("uses the display-override segment when present", () => {
		expect(formatCardText("See {@item wand of fireballs|DMG|the wand}.")).toBe("See the wand.");
	});

	it("ignores source metadata segments", () => {
		expect(formatCardText("See {@item wand of fireballs|DMG}.")).toBe("See wand of fireballs.");
	});

	it("renders recharge tags and tags without arguments", () => {
		expect(formatCardText("{@recharge 5} and {@recharge} {@h}")).toBe("(Recharge 5-6) and (Recharge 6) Hit: ");
	});

	it("renders recharge tags in the Ancient Gold Dragon breath action name", () => {
		expect(formatCardText("Breath Weapons {@recharge 5}")).toBe("Breath Weapons (Recharge 5-6)");
	});

	it("flattens nested entry, item, and entry fields", () => {
		expect(flattenCardEntries([
			"A {@damage 1d6} effect.",
			{name: "Special", entries: [{entry: "{@b Bold text}"}]},
			{items: ["{@i Listed text}"]},
		])).toBe("A 1d6 effect. Special: Bold text Listed text");
	});
});