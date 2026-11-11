(() => {
	const state = {
		config: null,
		all: [],
		filtered: [],
		selected: new Map(),
		clearedGroups: new Set(),
		zoom: 1,
		layout: "fronts",
	};

	const $ = id => document.getElementById(id);
	const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
	const utils = globalThis.CardToolUtils;
	const pagePlan = globalThis.CardToolPages;

	function idOf (entity) {
		return `${state.config.type}|${entity.name}|${entity.source}`;
	}

	async function load () {
		const { base, files, payload = state.config.type } = state.config;
		const results = await Promise.allSettled(files.map(file => fetch(`${base}${file}.json`).then(response => response.ok ? response.json() : null)));
		state.all = results.flatMap(result => {
			const value = result.status === "fulfilled" ? result.value : null;
			return Array.isArray(value?.[payload]) ? value[payload] : [];
		});
		if (state.config.prepare) state.all = await state.config.prepare(state.all);
		const seen = new Set();
		state.all = state.all.filter(entity => {
			const id = idOf(entity);
			if (seen.has(id)) return false;
			seen.add(id);
			return true;
		}).sort((a, b) => a.name.localeCompare(b.name));
	}

	function active (group) {
		return [...document.querySelectorAll(`[data-filter-group="${group}"].on`)].map(element => element.dataset.value);
	}

	function buildFilters () {
		const groups = state.config.filters || [];
		const host = $("filter-groups");
		host.innerHTML = "";
		for (const group of groups) {
			const section = document.createElement("section");
			section.className = "filter-section";
			const baseAction = group.id === "source" ? `<button class="filter-action" type="button" data-base-sources>5E Base</button>` : "";
			section.innerHTML = `<div class="filter-title-row"><h2>${esc(group.label)}</h2><span class="filter-actions"><button class="filter-action" type="button" data-all>All</button>${baseAction}<button class="filter-action" type="button" data-clear>Clear</button></span></div><div class="chips" data-chip-host="${esc(group.id)}"></div>`;
			host.appendChild(section);
			const values = utils.getFilterValues(state.all, group);
			const chips = section.querySelector(".chips");
			for (const value of values) {
				const chip = document.createElement("button");
				chip.type = "button";
				chip.className = "chip on";
				chip.textContent = group.labels?.[value] || value;
				chip.dataset.filterGroup = group.id;
				chip.dataset.value = value;
				chip.addEventListener("click", () => { chip.classList.toggle("on"); state.clearedGroups.delete(group.id); filter(); });
				chips.appendChild(chip);
			}
			section.querySelector("[data-all]").addEventListener("click", () => {
				section.querySelectorAll(".chip").forEach(chip => chip.classList.add("on"));
				state.clearedGroups.delete(group.id);
				filter();
			});
			section.querySelector("[data-clear]").addEventListener("click", () => {
				section.querySelectorAll(".chip").forEach(chip => chip.classList.remove("on"));
				state.clearedGroups.add(group.id);
				filter();
			});
			section.querySelector("[data-base-sources]")?.addEventListener("click", () => {
				const baseSources = new Set(state.config.baseSources || utils.BASE_SOURCE_CODES);
				section.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("on", baseSources.has(chip.dataset.value)));
				state.clearedGroups.delete(group.id);
				filter();
			});
		}
	}

	function filter () {
		const query = $("query").value.trim().toLowerCase();
		const groups = state.config.filters || [];
		state.filtered = state.all.filter(entity => {
			if (query && !entity.name.toLowerCase().includes(query)) return false;
			return groups.every(group => {
				const values = active(group.id);
				return utils.passesFilterGroup(group.values(entity), values, state.clearedGroups.has(group.id));
			});
		});
		const sort = $("sort").value;
		state.filtered.sort((a, b) => state.config.sort(a, b, sort));
		const entityLabel = state.config.entityLabel.replace(/s$/i, "").toLowerCase();
		$("result-count").textContent = `${state.filtered.length} ${entityLabel}${state.filtered.length === 1 ? "" : "s"}`;
		renderList();
	}

	function renderList () {
		const list = $("entity-list");
		list.innerHTML = "";
		for (const entity of state.filtered) {
			const id = idOf(entity);
			const row = document.createElement("button");
			row.type = "button";
			row.className = `entity-row${state.selected.has(id) ? " selected" : ""}`;
			row.innerHTML = `<span class="entity-check">✓</span><span class="entity-dot" style="background:${esc(state.config.color(entity))}"></span><span class="entity-copy"><strong>${esc(entity.name)}</strong><small>${esc(state.config.listMeta(entity))}</small></span>`;
			row.addEventListener("click", () => toggle(entity));
			list.appendChild(row);
		}
	}

	function toggle (entity) {
		const id = idOf(entity);
		if (state.selected.has(id)) state.selected.delete(id);
		else state.selected.set(id, entity);
		updateSelection();
	}

	function updateSelection () {
		$("selection-count").textContent = state.selected.size;
		renderList();
		const tray = $("selection-tray");
		tray.innerHTML = state.selected.size ? "" : "<span class=\"tray-empty\">No cards selected</span>";
		for (const [id, entity] of state.selected) {
			const chip = document.createElement("span");
			chip.className = "tray-chip";
			chip.innerHTML = `${esc(entity.name)} <button type="button" aria-label="Remove ${esc(entity.name)}">×</button>`;
			chip.querySelector("button").addEventListener("click", () => { state.selected.delete(id); updateSelection(); });
			tray.appendChild(chip);
		}
		if (state.selected.size) buildPreview();
		else hidePreview();
	}

	function updateLayoutButtons () {
		document.querySelectorAll("#layout-group [data-layout]").forEach(button => {
			button.setAttribute("aria-pressed", String(button.dataset.layout === state.layout));
		});
	}

	function buildPreview () {
		const selectedItems = [...state.selected.values()].sort((a, b) => state.config.sort(a, b, $("sort").value));
		const items = selectedItems.flatMap(entity => state.config.expand ? state.config.expand(entity) : [entity]);
		const plan = pagePlan.buildPagePlan(items, state.config.page, state.layout);
		const sheetCount = plan.reduce((count, entry) => Math.max(count, entry.sheetIndex), 0);
		const screen = $("screen-pages");
		const print = $("print-area");
		screen.innerHTML = "";
		print.innerHTML = "";
		plan.forEach(entry => {
			const label = document.createElement("div");
			label.className = "page-label";
			label.textContent = `Sheet ${entry.sheetIndex} of ${sheetCount} - ${entry.side === "back" ? "Backs" : "Fronts"}`;
			screen.appendChild(label);
			const screenPage = document.createElement("div");
			screenPage.className = "screen-page";
			applyPageLayout(screenPage);
			const printPage = document.createElement("div");
			printPage.className = "page";
			applyPageLayout(printPage);
			entry.cards.forEach((entity, position) => {
				const screenCard = document.createElement("div");
				screenCard.className = `screen-card${entity ? "" : " empty"}`;
				screenCard.innerHTML = entity ? state.config.render(entry.side, entity) : "";
				screenPage.appendChild(screenCard);
				const printCard = document.createElement("div");
				printCard.className = `card${entity ? "" : " empty"}`;
				if ((position + 1) % state.config.page.columns === 0) printCard.style.borderRight = "0";
				if (position >= (state.config.page.rows - 1) * state.config.page.columns) printCard.style.borderBottom = "0";
				printCard.innerHTML = entity ? state.config.render(entry.side, entity) : "";
				printPage.appendChild(printCard);
			});
			screen.appendChild(screenPage);
			print.appendChild(printPage);
		});
		updateLayoutButtons();
		$("placeholder").hidden = true;
		screen.hidden = false;
		$("print-actions").hidden = false;
		fitRenderedCards(screen);
		fitRenderedCards(print);
		screen.querySelectorAll(".screen-page").forEach(page => page.style.transform = `scale(${state.zoom})`);
	}

	function applyPageLayout (page) {
		const isPortrait = state.config.page.orientation === "portrait";
		page.style.setProperty("--page-columns", state.config.page.columns);
		page.style.setProperty("--page-rows", state.config.page.rows);
		page.style.setProperty("--page-width", isPortrait ? "210mm" : "297mm");
		page.style.setProperty("--page-height", isPortrait ? "297mm" : "210mm");
		page.style.aspectRatio = isPortrait ? "210 / 297" : "297 / 210";
	}

	function hidePreview () {
		$("placeholder").hidden = false;
		$("screen-pages").hidden = true;
		$("print-actions").hidden = true;
		$("print-area").innerHTML = "";
		document.body.classList.remove("print-debug");
		document.body.classList.remove("no-bg-graphics");
		state.layout = "fronts";
		updateLayoutButtons();
	}

	function updateDebugButtons () {
		const bgButton = $("btn-toggle-bg");
		if (bgButton) {
			const isOff = document.body.classList.contains("no-bg-graphics");
			bgButton.textContent = isOff ? "Background Graphics: OFF" : "Background Graphics: ON";
			bgButton.classList.toggle("bg-off", isOff);
		}
	}

	function togglePrintDebug () {
		document.body.classList.toggle("print-debug");
		const isDebug = document.body.classList.contains("print-debug");
		if (isDebug) {
			window.scrollTo(0, 0);
			fitRenderedCards($("print-area"));
		} else {
			document.body.classList.remove("no-bg-graphics");
			updateDebugButtons();
		}
	}

	function toggleBgGraphics () {
		const isOff = document.body.classList.toggle("no-bg-graphics");
		const bgButton = $("btn-toggle-bg");
		if (bgButton) {
			bgButton.textContent = isOff ? "Background Graphics: OFF" : "Background Graphics: ON";
			bgButton.classList.toggle("bg-off", isOff);
		}
	}

	function hasOverflow (element) {
		return element && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1);
	}

	function fitTitle (title, fit) {
		if (title.classList.contains("beast-title")) return fitBeastTitle(title);
		title.classList.remove("title-wrap");
		title.style.fontSize = `${fit.defaultPt}pt`;
		const clone = title.cloneNode(true);
		clone.style.cssText = "position:fixed;left:-10000px;white-space:nowrap;width:max-content;visibility:hidden";
		clone.style.font = getComputedStyle(title).font;
		document.body.appendChild(clone);
		const fits = clone.offsetWidth <= title.clientWidth;
		clone.remove();
		if (!fits) {
			title.classList.add("title-wrap");
			title.style.fontSize = `${fit.wrapStartPt}pt`;
			while (fit.wrapMinPt < parseFloat(title.style.fontSize) && hasOverflow(title)) title.style.fontSize = `${Math.max(fit.wrapMinPt, parseFloat(title.style.fontSize) - fit.stepPt)}pt`;
			return;
		}
		while (fit.singleLineMinPt < parseFloat(title.style.fontSize) && hasOverflow(title)) title.style.fontSize = `${Math.max(fit.singleLineMinPt, parseFloat(title.style.fontSize) - fit.stepPt)}pt`;
	}

	function fitBeastTitle (title) {
		const suffix = title.dataset.titleSuffix || "";
		const name = title.textContent.slice(0, title.textContent.length - suffix.length);
		title.style.whiteSpace = "nowrap";
		title.style.fontSize = "14pt";
		const availableWidth = title.clientWidth || title.parentElement?.clientWidth || 353;
		const clone = title.cloneNode(true);
		clone.style.cssText = "position:fixed;left:-10000px;white-space:nowrap;width:max-content;visibility:hidden";
		document.body.appendChild(clone);
		const fits = text => {
			clone.textContent = text;
			return clone.offsetWidth <= availableWidth;
		};
		while (parseFloat(title.style.fontSize) > 11 && !fits(title.textContent)) title.style.fontSize = `${Math.max(11, parseFloat(title.style.fontSize) - 0.25)}pt`;
		if (fits(title.textContent)) {
			clone.remove();
			return;
		}
		let low = 0;
		let high = name.length;
		while (low < high) {
			const middle = Math.ceil((low + high) / 2);
			if (fits(`${name.slice(0, middle).trimEnd()}...${suffix}`)) low = middle;
			else high = middle - 1;
		}
		title.textContent = `${name.slice(0, low).trimEnd()}...${suffix}`;
		clone.remove();
	}

	function fitRenderedCards (root) {
		if (!root) return;
		const isPrint = root.id === "print-area";
		if (isPrint) root.classList.add("fit-measure");
		const fit = utils.CARD_FIT;
		root.querySelectorAll(".entity-title, .back-card-title").forEach(title => fitTitle(title, title.classList.contains("back-card-title") ? fit.backTitle : fit.title));
		root.querySelectorAll(".beast-statblock").forEach(statblock => {
			if (statblock.scrollHeight > statblock.clientHeight) statblock.classList.add("beast-compact");
		});
		root.querySelectorAll(".card-inner").forEach(inner => {
			const body = inner.querySelector(".entity-body");
			if (!body) return;
			body.style.fontSize = `${fit.description.defaultPt}pt`;
			body.style.lineHeight = fit.description.defaultLineHeight;
			while (fit.description.minPt < parseFloat(body.style.fontSize) && hasOverflow(inner)) {
				const size = Math.max(fit.description.minPt, parseFloat(body.style.fontSize) - fit.description.stepPt);
				const progress = (fit.description.defaultPt - size) / (fit.description.defaultPt - fit.description.minPt);
				body.style.fontSize = `${size}pt`;
				body.style.lineHeight = (fit.description.defaultLineHeight - (fit.description.defaultLineHeight - fit.description.minLineHeight) * progress).toFixed(3);
			}
		});
		if (isPrint) root.classList.remove("fit-measure");
	}

	function clearSelection () {
		state.selected.clear();
		updateSelection();
	}

	function saveBook () {
		if (!state.selected.size) return alert(`Select at least one ${state.config.entityLabel.toLowerCase()} first.`);
		const name = prompt("Spellbook name:", `${state.config.entityLabel} Collection`);
		if (!name?.trim()) return;
		const key = `card-tool-${state.config.type}-books`;
		const books = JSON.parse(localStorage.getItem(key) || "{}");
		books[name.trim()] = [...state.selected.values()].map(entity => ({ name: entity.name, source: entity.source }));
		localStorage.setItem(key, JSON.stringify(books));
		alert(`Saved "${name.trim()}".`);
	}

	function setZoom (delta) {
		state.zoom = Math.min(2, Math.max(0.5, state.zoom + delta));
		$("zoom-label").textContent = `${Math.round(state.zoom * 100)}%`;
		$("screen-pages").querySelectorAll(".screen-page").forEach(page => page.style.transform = `scale(${state.zoom})`);
	}

	function start (config) {
		state.config = { ...config, page: { rows: 2, columns: 4, orientation: "landscape", ...config.page } };
		document.body.classList.toggle("page-portrait", state.config.page.orientation === "portrait");
		$("entity-label").textContent = config.entityLabel;
		$("page-title").textContent = config.title;
		$("query").placeholder = `${config.entityLabel} name...`;
		$("sort").innerHTML = config.sortOptions.map(option => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join("");
		$("query").addEventListener("input", filter);
		$("sort").addEventListener("change", filter);
		$("select-visible").addEventListener("click", () => { state.filtered.forEach(entity => state.selected.set(idOf(entity), entity)); updateSelection(); });
		$("clear-selection").addEventListener("click", clearSelection);
		$("zoom-out").addEventListener("click", () => setZoom(-0.1));
		$("zoom-in").addEventListener("click", () => setZoom(0.1));
		$("layout-group").addEventListener("click", event => {
			const button = event.target.closest("[data-layout]");
			if (!button) return;
			state.layout = button.dataset.layout;
			updateLayoutButtons();
			buildPreview();
		});
		$("debug-print").addEventListener("click", togglePrintDebug);
		$("btn-exit-debug").addEventListener("click", togglePrintDebug);
		$("btn-toggle-bg").addEventListener("click", toggleBgGraphics);
		$("print-cards").addEventListener("click", () => window.print());
		$("save-book").addEventListener("click", saveBook);
		updateLayoutButtons();
		$("overlay-text").textContent = `Loading ${config.entityLabel.toLowerCase()}...`;
		load().then(() => { buildFilters(); filter(); $("overlay").hidden = true; }).catch(error => { $("overlay-text").textContent = `Unable to load ${config.entityLabel.toLowerCase()}: ${error.message}`; });
	}

	window.CardTool = { start };
})();
