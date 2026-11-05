import {BASE_SOURCE_CODES, getBaseSourceValues, getFilterValues, passesFilterGroup} from "../../js/card-tool-utils.js";

describe("card tool filter utilities", () => {
	it("selects only the 5E base source codes", () => {
		expect(getBaseSourceValues(["PHB", "XPHB", "XGE", "TCE", "SCC"])).toEqual(["PHB", "XGE", "TCE"]);
		expect(getBaseSourceValues(["PHB", "XPHB"], BASE_SOURCE_CODES)).toEqual(["PHB"]);
	});

	it("builds sorted, de-duplicated filter values", () => {
		const group = {values: entity => entity.sources};
		expect(getFilterValues([{sources: ["XGE", "PHB"]}, {sources: ["PHB", "TCE"]}], group)).toEqual(["PHB", "TCE", "XGE"]);
	});

	it("distinguishes a cleared group from an unfiltered group", () => {
		expect(passesFilterGroup(["PHB"], [], false)).toBe(true);
		expect(passesFilterGroup(["PHB"], [], true)).toBe(false);
	});
});