const TAG_RE = /\{@(\w+)(?:\s+([^}]*?))?\}/g;

export function formatCardText (value) {
	return String(value ?? "").replace(TAG_RE, (match, tag, raw) => {
		const parts = (raw || "").split("|");
		if (tag === "recharge") {
			const amount = parts[0] || "6";
			return `(Recharge ${amount}${amount !== "6" ? "-6" : ""})`;
		}
		if (tag === "h") return "Hit: ";
		return parts[2] || parts[0];
	});
}

export function flattenCardEntries (entries) {
	if (!Array.isArray(entries)) return "";
	return entries.map(entry => {
		if (typeof entry === "string") return formatCardText(entry);
		if (entry?.entries) return `${entry.name ? `${entry.name}: ` : ""}${flattenCardEntries(entry.entries)}`;
		if (entry?.entry) return `${entry.name ? `${entry.name}: ` : ""}${flattenCardEntries([entry.entry])}`;
		if (entry?.items) return flattenCardEntries(entry.items);
		return "";
	}).filter(Boolean).join(" ");
}
