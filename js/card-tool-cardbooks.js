export const CARD_BOOK_FORMAT = "5etools-cardbook-v1";
export const LEGACY_SPELL_FORMAT = "5etools-spellbook-v1";
export const LEGACY_SPELL_KEY = "spell-cards-spellbooks";

const KNOWN_FORMATS = new Set([CARD_BOOK_FORMAT, LEGACY_SPELL_FORMAT]);

const text = value => typeof value === "string" ? value.trim() : "";

const fail = reason => ({ok: false, reason});

const ok = (book, legacy = false) => ({ok: true, book, legacy});

export function bookKey (type) {
	return `card-tool-${type}-books`;
}

export function referenceId (ref, type = ref?.type) {
	return `${text(type)}|${text(ref?.name)}|${text(ref?.source)}`;
}

function toRef (value, {type} = {}) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const name = text(value.name);
	const source = text(value.source);
	const refType = text(value.type) || text(type);
	if (!name || !source || !refType) return null;
	return {type: refType, name, source};
}

function normalizeCards (cards, {type} = {}) {
	const refs = [];
	const seen = new Set();
	for (const card of cards) {
		const ref = toRef(card, {type});
		if (!ref) continue;
		const id = referenceId(ref);
		if (seen.has(id)) continue;
		seen.add(id);
		refs.push(ref);
	}
	return refs;
}

function readTypedBook (cards, {name}) {
	if (!cards.length) return fail("Stored cardbook has no cards.");
	const refs = normalizeCards(cards);
	if (!refs.length) return fail("Stored cardbook has no usable card references.");
	return ok({format: CARD_BOOK_FORMAT, name, cards: refs});
}

function readLegacyCards (cards, {pageType, name}) {
	if (!name) return fail("Stored cardbook has no usable name.");
	if (pageType !== "spell") return fail("Untyped card references can only be read as spells, so this cardbook cannot be read on this page.");
	if (!cards.length) return fail("Stored cardbook has no cards.");
	const refs = normalizeCards(cards, {type: "spell"});
	if (!refs.length) return fail("Stored cardbook has no usable card references.");
	return ok({format: CARD_BOOK_FORMAT, name, cards: refs}, true);
}

/**
 * Validate an already-parsed stored value.
 * Returns {ok: true, book, legacy} or {ok: false, reason}.
 *
 * Accepted shapes:
 * - typed envelope: {format: "5etools-cardbook-v1", name, cards: [{type, name, source}]}
 * - legacy spell envelope: {format: "5etools-spellbook-v1", name, cards: [{name, source}]}
 * - legacy bare array of {name, source} references (spell page only)
 * Anything else is reported as unreadable and never coerced to a guessed entity type.
 */
export function readBook (value, {pageType, name} = {}) {
	const fallbackName = text(name);
	if (Array.isArray(value)) return readLegacyCards(value, {pageType, name: fallbackName});
	if (!value || typeof value !== "object") return fail("Stored cardbook is not a readable cardbook.");
	const format = text(value.format);
	if (!format) return fail("Stored cardbook is missing its format marker.");
	if (!KNOWN_FORMATS.has(format)) return fail(`Stored cardbook uses an unknown format (${format}).`);
	if (!Array.isArray(value.cards)) return fail("Stored cardbook is missing its card list.");
	const bookName = text(value.name);
	if (!bookName) return fail("Stored cardbook has no usable name.");
	if (format === LEGACY_SPELL_FORMAT) return readLegacyCards(value.cards, {pageType, name: bookName});
	return readTypedBook(value.cards, {name: bookName});
}

/**
 * Parse and validate a stored string. Returns the same result shape as readBook().
 */
export function parseBook (rawText, {pageType, name} = {}) {
	if (typeof rawText !== "string" || !rawText.trim()) return fail("Stored cardbook is empty.");
	let value;
	try {
		value = JSON.parse(rawText);
	} catch (error) {
		return fail("Stored cardbook is not valid JSON.");
	}
	return readBook(value, {pageType, name});
}

/**
 * Normalise a stored value to the typed 5etools-cardbook-v1 envelope, or null when unreadable.
 */
export function normalizeBook (value, {pageType, name} = {}) {
	const result = readBook(value, {pageType, name});
	return result.ok ? result.book : null;
}

function cardsOf (book) {
	if (Array.isArray(book)) return book;
	return Array.isArray(book?.cards) ? book.cards : [];
}

export function dedupeRefs (refs, {type} = {}) {
	return normalizeCards(Array.isArray(refs) ? refs : [], {type});
}

/**
 * Union current references with newly resolved ones, keeping the first occurrence of each
 * `${type}|${name}|${source}` identity. `type` fills in entities that do not carry one.
 */
export function mergeSelectionRefs (current, resolved, {type} = {}) {
	return normalizeCards([...(current ?? []), ...(resolved ?? [])], {type});
}

/**
 * Build the `${type}|${name}|${source}` lookup used to resolve stored references.
 */
export function entityLookup (entities, type) {
	const lookup = new Map();
	for (const entity of entities ?? []) {
		// Entities carry their own domain `type` field (item kind, creature type), so the
		// page type passed in is the only reliable identity prefix here.
		const id = `${text(type)}|${text(entity?.name)}|${text(entity?.source)}`;
		if (!lookup.has(id)) lookup.set(id, entity);
	}
	return lookup;
}

/**
 * Resolve a book's references against the loaded entity set.
 * Returns {resolved, unmatched}; unmatched references are never inserted.
 */
export function resolveCards (book, lookup) {
	const cards = dedupeRefs(cardsOf(book));
	const resolved = [];
	const unmatched = [];
	const seen = new Set();
	for (const ref of cards) {
		const id = referenceId(ref);
		const entity = typeof lookup === "function" ? lookup(id) : lookup?.get?.(id);
		if (!entity) {
			unmatched.push(ref);
			continue;
		}
		if (seen.has(id)) continue;
		seen.add(id);
		resolved.push(entity);
	}
	return {resolved, unmatched};
}

globalThis.CardToolCardbooks = {
	CARD_BOOK_FORMAT,
	LEGACY_SPELL_FORMAT,
	LEGACY_SPELL_KEY,
	bookKey,
	referenceId,
	readBook,
	parseBook,
	normalizeBook,
	dedupeRefs,
	mergeSelectionRefs,
	entityLookup,
	resolveCards,
};
