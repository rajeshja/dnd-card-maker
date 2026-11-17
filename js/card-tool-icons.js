// Shared icon sprite and presentation option registry for the card tool.
//
// The three card pages carry `data-icon="<id>"` placeholders only. `installSprite()`
// puts this sprite in the document once and `hydrateIcons()` fills every placeholder,
// so the option menus and the workspace bar reference one source of truth.

const SPRITE_ID = "card-tool-icon-sprite";
const SPRITE_NS = "http://www.w3.org/2000/svg";

export const ICONS = Object.freeze({
	// The brand mark is a card pack with one card rising out: filled paper card
	// inside a gold outline pack, deliberately unlike the thin control outlines.
	brand: {
		viewBox: "0 0 24 24",
		body: `<path d="M4 9.5h16V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M7.5 9.5V7.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2"/><rect x="8" y="2" width="8" height="10" rx=".8" fill="#fffdf7"/><path d="M10 4.6h4M10 6.9h4" fill="none" stroke="#12100a" stroke-width=".9" stroke-linecap="round"/>`,
	},
	single: {
		viewBox: "0 0 16 16",
		body: `<rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M5.5 5.5h5"/>`,
	},
	overflow: {
		viewBox: "0 0 16 16",
		body: `<rect x="1.5" y="3.5" width="8" height="10" rx="1"/><rect x="4.5" y="1.5" width="8" height="10" rx="1"/><path d="M8 6.5h4.5M10.8 4.7 12.6 6.5l-1.8 1.8"/>`,
	},
	fronts: {
		viewBox: "0 0 16 16",
		body: `<rect x="3.5" y="1.5" width="9" height="13" rx="1"/><path d="M5.5 4.5h5M5.5 7h5M5.5 9.5h5M5.5 12h3"/>`,
	},
	backs: {
		viewBox: "0 0 16 16",
		body: `<rect x="3.5" y="1.5" width="9" height="13" rx="1"/><rect x="5.2" y="3.4" width="5.6" height="4.4" rx=".5"/><path d="M5.5 10h5M5.5 12h3"/>`,
	},
	both: {
		viewBox: "0 0 16 16",
		body: `<rect x="1.5" y="2.5" width="6" height="11" rx="1"/><rect x="8.5" y="2.5" width="6" height="11" rx="1"/><path d="M4.5 5.5h2M4.5 7.5h2M9.5 5.5h2M9.5 7.5h2"/>`,
	},
	auto: {
		viewBox: "0 0 16 16",
		body: `<path d="M8 2.3 9.35 6.65 13.7 8 9.35 9.35 8 13.7 6.65 9.35 2.3 8 6.65 6.65Z"/><path d="M12.4 2.2v2.1M11.35 3.25h2.1"/>`,
	},
	large: {
		viewBox: "0 0 16 16",
		body: `<rect x="1.8" y="3.6" width="12.4" height="8.8" rx="1"/><rect x="5.4" y="6.1" width="5.2" height="3.8" rx=".5"/>`,
	},
	grid: {
		viewBox: "0 0 16 16",
		body: `<rect x="2" y="2" width="5" height="5" rx=".6"/><rect x="9" y="2" width="5" height="5" rx=".6"/><rect x="2" y="9" width="5" height="5" rx=".6"/><rect x="9" y="9" width="5" height="5" rx=".6"/>`,
	},
	save: {
		viewBox: "0 0 16 16",
		body: `<path d="M2.5 2.5h8.2l2.8 2.8v8.2h-11z"/><path d="M5 2.5v4h6v-4M5 13.5v-4h6v4"/>`,
	},
	load: {
		viewBox: "0 0 16 16",
		body: `<path d="M1.8 4h4.1l1.5 1.6h6.8v7.2H1.8z"/><path d="M1.8 6.7h12.4"/>`,
	},
	print: {
		viewBox: "0 0 16 16",
		body: `<path d="M4.5 6V2.5h7V6"/><rect x="2.5" y="6" width="11" height="5.2" rx="1"/><path d="M4.5 9.4h7v4.1h-7z"/>`,
	},
	debug: {
		viewBox: "0 0 16 16",
		body: `<path d="M3 2.5h6.8l3.2 3.2v8.3H3z"/><circle cx="7" cy="8.4" r="1.9"/><path d="M8.4 9.8 10.6 12"/>`,
	},
	browse: {
		viewBox: "0 0 16 16",
		body: `<path d="M4.6 3.6h9M4.6 8h9M4.6 12.4h9"/><circle cx="2.2" cy="3.6" r=".7" fill="currentColor" stroke="none"/><circle cx="2.2" cy="8" r=".7" fill="currentColor" stroke="none"/><circle cx="2.2" cy="12.4" r=".7" fill="currentColor" stroke="none"/>`,
	},
});

export const ICON_IDS = Object.freeze(Object.keys(ICONS));

// Content, layout, and density options live here so the menu markup, the closed
// trigger label, and the unit tests all read the same names and icon ids.
export const OPTION_GROUPS = Object.freeze({
	content: Object.freeze({
		label: "Content mode",
		triggerName: "Content mode",
		options: Object.freeze([
			Object.freeze({value: "single", name: "Single card", icon: "single"}),
			Object.freeze({value: "overflow", name: "Overflow", icon: "overflow"}),
		]),
	}),
	layout: Object.freeze({
		label: "Card layout",
		triggerName: "Card layout",
		options: Object.freeze([
			Object.freeze({value: "fronts", name: "Fronts", icon: "fronts"}),
			Object.freeze({value: "backs", name: "Backs", icon: "backs"}),
			Object.freeze({value: "both", name: "Both", icon: "both"}),
		]),
	}),
	density: Object.freeze({
		label: "Preview density",
		triggerName: "Preview density",
		options: Object.freeze([
			Object.freeze({value: "auto", name: "Auto", icon: "auto"}),
			Object.freeze({value: "large", name: "Large", icon: "large"}),
			Object.freeze({value: "grid", name: "Grid", icon: "grid"}),
		]),
	}),
});

export function hasIcon (id) {
	return Object.prototype.hasOwnProperty.call(ICONS, id);
}

export function symbolId (id) {
	return `ct-icon-${id}`;
}

export function spriteMarkup () {
	const symbols = Object.entries(ICONS).map(([id, icon]) =>
		`<symbol id="${symbolId(id)}" viewBox="${icon.viewBox}">${icon.body}</symbol>`).join("");
	return `<svg xmlns="${SPRITE_NS}" class="ct-sprite" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute;overflow:hidden"><defs>${symbols}</defs></svg>`;
}

// Unknown ids are a programming error, not a rendering state: callers hydrate
// trusted registry values, so a miss here means the registry and sprite drifted.
export function iconMarkup (id) {
	if (!hasIcon(id)) throw new Error(`Unknown card-tool icon: ${id}`);
	return `<svg class="ct-icon" viewBox="${ICONS[id].viewBox}" aria-hidden="true" focusable="false"><use href="#${symbolId(id)}"></use></svg>`;
}

export function findOption (group, value) {
	const entry = OPTION_GROUPS[group];
	if (!entry) return null;
	return entry.options.find(option => option.value === value) ?? null;
}

export function activeOption (group, value) {
	const entry = OPTION_GROUPS[group];
	if (!entry) return null;
	return findOption(group, value) ?? entry.options[0];
}

export function triggerLabel (group, value) {
	const entry = OPTION_GROUPS[group];
	const option = activeOption(group, value);
	if (!entry || !option) return "";
	return `${entry.triggerName}: ${option.name}`;
}

export function installSprite (doc = globalThis.document) {
	if (!doc?.body || doc.getElementById(SPRITE_ID)) return false;
	const host = doc.createElement("div");
	host.id = SPRITE_ID;
	host.setAttribute("aria-hidden", "true");
	host.innerHTML = spriteMarkup();
	doc.body.prepend(host);
	return true;
}

export function renderIcon (host, id) {
	if (!host) return false;
	if (!hasIcon(id)) {
		console.warn(`Card tool: missing icon "${id}"`);
		return false;
	}
	host.dataset.icon = id;
	host.innerHTML = iconMarkup(id);
	return true;
}

export function hydrateIcons (root = globalThis.document) {
	const hosts = [...(root?.querySelectorAll?.("[data-icon]") ?? [])];
	let missing = 0;
	for (const host of hosts) {
		if (!renderIcon(host, host.dataset.icon)) missing++;
	}
	return {count: hosts.length, missing};
}

globalThis.CardToolIcons = {
	ICONS,
	ICON_IDS,
	OPTION_GROUPS,
	hasIcon,
	symbolId,
	spriteMarkup,
	iconMarkup,
	findOption,
	activeOption,
	triggerLabel,
	installSprite,
	renderIcon,
	hydrateIcons,
};
