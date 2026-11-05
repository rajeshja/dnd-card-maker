const SCHOOLS = { A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation" };
const spellClasses = spell => spell._classes || [];
const prepareSpells = async spells => {
	try {
		const response = await fetch("./5etools/data/spells/sources.json");
		if (!response.ok) return spells;
		const sources = await response.json();
		return spells.map(spell => {
			const sourceSpell = sources[spell.source]?.[spell.name];
			const classes = [...(sourceSpell?.class || []), ...(sourceSpell?.classVariant || [])].map(entry => entry.name).filter(Boolean);
			return {...spell, _classes: [...new Set(classes)]};
		});
	} catch (error) {
		return spells;
	}
};
const spellText = entries => (entries || []).map(entry => {
	if (typeof entry === "string") return entry.replace(/\{@\w+ ([^}|]+)(?:\|[^}]*)?\}/g, "$1");
	if (entry.type === "table") return "[Table]";
	if (entry.items) return spellText(entry.items);
	if (entry.entries) return `${entry.name ? `${entry.name}: ` : ""}${spellText(entry.entries)}`;
	return "";
}).filter(Boolean).join(" ");
const paragraphs = entries => spellText(entries).split(/(?<=\.)\s+/).filter(Boolean).map(text => `<p>${text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]))}</p>`).join("");
const ordinal = level => level === 0 ? "Cantrip" : `${["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"][level]}-level`;
const spellMeta = spell => `${ordinal(spell.level)} · ${SCHOOLS[spell.school] || spell.school} · ${spell.source}`;
const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const spellTime = spell => spell.time?.[0] ? `${spell.time[0].number} ${spell.time[0].unit}` : "—";
const spellRange = spell => spell.range?.type === "point" ? spell.range.distance?.type || "—" : spell.range?.type || "—";
const spellDuration = spell => spell.duration?.[0]?.type === "timed" ? `${spell.duration[0].duration.amount} ${spell.duration[0].duration.type}` : spell.duration?.[0]?.type || "—";
const spellComponents = spell => [spell.components?.v && "V", spell.components?.s && "S", spell.components?.m && "M"].filter(Boolean).join(" ") || "—";
const spellCard = spell => {
	const concentration = spell.duration?.[0]?.concentration;
	const ritual = spell.meta?.ritual;
	const material = typeof spell.components?.m === "string" ? spell.components.m : spell.components?.m?.text;
	return `<div class="card-inner school-${escapeText(spell.school || "")}"><article class="entity-card spell-card"><h1 class="entity-title spell-title">${escapeText(spell.name)}${concentration || ritual ? `<span class="spell-title-indicator">${concentration ? "◉" : ""}${ritual ? " ✧" : ""}</span>` : ""}</h1><hr class="spell-divider"><div class="spell-meta"><div class="spell-meta-row"><strong>${escapeText(ordinal(spell.level))}</strong> · ${escapeText(spellTime(spell))} · ${escapeText(spellRange(spell))}</div><div class="spell-meta-row">${escapeText(spellDuration(spell))} · ${escapeText(spellComponents(spell))}</div></div><hr class="spell-divider"><div class="entity-body spell-description">${paragraphs(spell.entries)}</div>${material ? `<div class="material-component"><strong>M:</strong> ${escapeText(material)}</div>` : ""}</article></div>`;
};
const spellBack = spell => {
	const school = SCHOOLS[spell.school] || spell.school || "School";
	const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const asset = name => `card-images/${name}-${slug}.png`;
	const indicators = [spell.duration?.[0]?.concentration && "◉ concentration", spell.meta?.ritual && "✧ ritual"].filter(Boolean);
	return `<div class="card-inner back-card-inner school-${escapeText(spell.school || "")}"><article class="back-card"><img class="back-ornament back-ornament-top" src="${asset("top-embellishment")}" alt=""><div class="back-kicker">Spell Card</div><img class="back-ornament back-ornament-underline" src="${asset("spell-card-underline")}" alt=""><div class="back-hero"><h1 class="back-card-title back-spell-name">${escapeText(spell.name)}</h1><img class="back-school-art" src="card-images/${slug}-icon.svg" alt=""></div>${indicators.length ? `<div class="back-indicators">${indicators.map(indicator => `<span class="back-indicator">${indicator}</span>`).join("")}</div>` : ""}<img class="back-ornament back-ornament-divider" src="${asset("section-divider")}" alt=""><div class="back-meta"><div class="back-meta-row"><img class="back-meta-icon" src="${asset("school-icon")}" alt=""><strong class="back-meta-label">School:</strong><span class="back-meta-value">${escapeText(school)}</span></div><div class="back-meta-row"><img class="back-meta-icon" src="${asset("level-icon")}" alt=""><strong class="back-meta-label">Level:</strong><span class="back-meta-value">${escapeText(ordinal(spell.level))}</span></div><div class="back-meta-row"><img class="back-meta-icon" src="${asset("classes-icon")}" alt=""><strong class="back-meta-label">Source:</strong><span class="back-meta-value">${escapeText(spell.source)}</span></div></div><img class="back-ornament back-ornament-bottom" src="${asset("bottom-embellishment")}" alt=""></article></div>`;
};
CardTool.start({
	type: "spell",
	page: { rows: 2, columns: 4, orientation: "landscape" },
	entityLabel: "Spells",
	title: "D&D Spell Card Printer",
	base: "./5etools/data/spells/",
	files: ["spells-xphb", "spells-phb", "spells-xge", "spells-tce", "spells-scc", "spells-ai", "spells-ftd", "spells-ggr", "spells-egw", "spells-idrotf", "spells-llk", "spells-aag", "spells-aitfr-avt", "spells-bmt", "spells-efa", "spells-frhof", "spells-sato"],
	baseSources: ["PHB", "XGE", "TCE"],
	prepare: prepareSpells,
	filters: [{ id: "source", label: "Source", values: spell => [spell.source] }, { id: "class", label: "Class", values: spellClasses }, { id: "school", label: "School", values: spell => [SCHOOLS[spell.school] || spell.school] }, { id: "level", label: "Level", values: spell => [spell.level === 0 ? "Cantrip" : `Level ${spell.level}`] }],
	sortOptions: [{ value: "level", label: "Level low to high" }, { value: "name", label: "Name A to Z" }, { value: "school", label: "School" }],
	sort: (a, b, mode) => mode === "name" ? a.name.localeCompare(b.name) : mode === "school" ? (SCHOOLS[a.school] || "").localeCompare(SCHOOLS[b.school] || "") || a.name.localeCompare(b.name) : a.level - b.level || a.name.localeCompare(b.name),
	color: spell => ({ A: "#3a6ea5", C: "#3a8a3a", D: "#6a5aad", E: "#9a3a8a", V: "#c0392b", I: "#2a8080", N: "#7a6030", T: "#8a7a20" }[spell.school] || "#888"),
	listMeta: spellMeta,
	render: (side, spell) => side === "back" ? spellBack(spell) : spellCard(spell),
});
