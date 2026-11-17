(() => {
	const state = {
		config: null,
		all: [],
		filtered: [],
		selected: new Map(),
		clearedGroups: new Set(),
		layout: "fronts",
		contentMode: "single",
		plan: [],
		inspectPlan: [],
		strips: [],
		printCards: new Map(),
		recorded: {signature: "", side: null},
		galleryScroll: {cards: 0, pages: 0},
		view: {
			previewMode: "pages",
			density: "auto",
			surface: null,
			manageQuery: "",
			manageConfirm: false,
			saveConfirm: null,
			loadConfirm: null,
			detailIndex: null,
			detailSide: "front",
			inspectSide: "front",
		},
		grid: {cols: 1, rows: 1, pageW: 0, cardW: 0},
	};

	const $ = id => document.getElementById(id);
	const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
	const utils = globalThis.CardToolUtils;
	const pagePlan = globalThis.CardToolPages;
	const layoutTool = globalThis.CardToolLayout;
	const cardbooks = globalThis.CardToolCardbooks;
	const icons = globalThis.CardToolIcons;
	const phoneQuery = window.matchMedia("(max-width: 599px)");

	let managerReturnFocus = null;
	let saveReturnFocus = null;
	let loadReturnFocus = null;
	let loadConfirm = null;
	let galleryPress = null;
	let suppressGalleryClick = false;
	let detailSwipe = null;
	let detailPointers = new Map();
	let detailPinch = null;
	let detailZoom = 1;
	let resetPagesZoom = () => {};
	let frame = 0;
	let openMenu = null;

	function idOf (entity) {
		return `${state.config.type}|${entity.name}|${entity.source}`;
	}

	function isPhone () {
		return phoneQuery.matches;
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
			section.dataset.filterSection = group.id;
			const baseAction = group.id === "source" ? `<button class="filter-action" type="button" data-base-sources>5E Base</button>` : "";
			section.innerHTML = `<div class="filter-title-row"><button class="filter-toggle" type="button" aria-expanded="true"><span class="filter-caret" aria-hidden="true">▾</span><h2>${esc(group.label)}</h2><span class="filter-summary">all</span></button><span class="filter-actions"><button class="filter-action" type="button" data-all>All</button>${baseAction}<button class="filter-action" type="button" data-clear>Clear</button></span></div><div class="chips" data-chip-host="${esc(group.id)}"></div>`;
			host.appendChild(section);
			const toggle = section.querySelector(".filter-toggle");
			if (isPhone()) {
				section.classList.add("collapsed");
				toggle.setAttribute("aria-expanded", "false");
			}
			toggle.addEventListener("click", () => {
				const collapsed = section.classList.toggle("collapsed");
				toggle.setAttribute("aria-expanded", String(!collapsed));
			});
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
		updateFilterSummaries();
	}

	function updateFilterSummaries () {
		document.querySelectorAll("[data-filter-section]").forEach(section => {
			const chips = [...section.querySelectorAll(".chip")];
			const on = chips.filter(chip => chip.classList.contains("on")).length;
			const summary = section.querySelector(".filter-summary");
			if (!summary) return;
			summary.textContent = on === chips.length ? "all" : on === 0 ? "none" : `${on} of ${chips.length}`;
			summary.title = summary.textContent;
		});
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
		updateFilterSummaries();
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
		const count = state.selected.size;
		$("selection-count").textContent = count;
		$("mobile-selected-count").textContent = count;
		const trigger = $("selection-count-trigger");
		if (trigger) {
			const label = `Manage selection: ${count} selected`;
			trigger.setAttribute("aria-label", label);
			trigger.dataset.tip = label;
		}
		renderList();
		if (state.view.surface === "selected" && $("selection-manager").open) renderManager();
		if (state.selected.size) buildPreview();
		else hidePreview();
	}

	function updateGroupButtons (group, value) {
		const option = icons.activeOption(group, value);
		if (!option) return;
		document.querySelectorAll(`#${group}-group [data-${group}]`).forEach(button => {
			button.setAttribute("aria-checked", String(button.dataset[group] === value));
		});
		const trigger = document.querySelector(`#${group}-group [data-dropdown-trigger]`);
		if (!trigger) return;
		const label = icons.triggerLabel(group, value);
		trigger.setAttribute("aria-label", label);
		trigger.dataset.tip = label;
		const labelHost = trigger.querySelector(".dropdown-label");
		if (labelHost) labelHost.textContent = option.name;
		icons.renderIcon(trigger.querySelector("[data-icon]"), option.icon);
	}

	function updateLayoutButtons () {
		updateGroupButtons("layout", state.layout);
	}

	function updateContentButtons () {
		updateGroupButtons("content", state.contentMode);
	}

	function updateDensityButtons () {
		updateGroupButtons("density", state.view.density);
	}

	function triggerFor (group) {
		return document.querySelector(`#${group}-group [data-dropdown-trigger]`);
	}

	function menuFor (group) {
		return $(`${group}-menu`);
	}

	function menuItems (menu) {
		return [...(menu?.querySelectorAll("[role='menuitemradio']") ?? [])];
	}

	// The menu is a popover so the top layer does the escaping; its position still comes
	// from the trigger rect because the UA centre placement is not the contract here.
	function positionMenu (group) {
		const trigger = triggerFor(group);
		const menu = menuFor(group);
		if (!trigger || !menu) return;
		const rect = trigger.getBoundingClientRect();
		const gap = 4;
		const margin = 8;
		menu.style.position = "fixed";
		menu.style.margin = "0";
		menu.style.minWidth = `${Math.max(rect.width, 168)}px`;
		const width = menu.offsetWidth || Math.max(rect.width, 168);
		const height = menu.offsetHeight || 0;
		menu.style.left = `${Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin))}px`;
		let top = rect.bottom + gap;
		if (top + height > window.innerHeight - margin && rect.top - gap - height >= margin) top = rect.top - gap - height;
		menu.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - height - margin))}px`;
	}

	function openDropdown (group, edge = "selected") {
		const trigger = triggerFor(group);
		const menu = menuFor(group);
		if (!trigger || !menu) return;
		if (openMenu && openMenu !== group) closeDropdown();
		if (typeof menu.showPopover === "function") {
			if (!menu.matches(":popover-open")) menu.showPopover();
		} else {
			menu.hidden = false;
		}
		menu.dataset.open = "true";
		openMenu = group;
		trigger.setAttribute("aria-expanded", "true");
		positionMenu(group);
		document.addEventListener("pointerdown", onMenuPointerDown, true);
		window.addEventListener("resize", onMenuResize, true);
		const items = menuItems(menu);
		const checked = items.find(item => item.getAttribute("aria-checked") === "true") ?? items[0];
		const target = edge === "last" ? items[items.length - 1] : checked;
		target?.focus();
	}

	function closeDropdown ({restoreFocus = false} = {}) {
		if (!openMenu) return;
		const group = openMenu;
		const trigger = triggerFor(group);
		const menu = menuFor(group);
		openMenu = null;
		document.removeEventListener("pointerdown", onMenuPointerDown, true);
		window.removeEventListener("resize", onMenuResize, true);
		if (menu) {
			delete menu.dataset.open;
			if (typeof menu.hidePopover === "function" && menu.matches(":popover-open")) menu.hidePopover();
			else menu.hidden = true;
		}
		trigger?.setAttribute("aria-expanded", "false");
		if (restoreFocus) trigger?.focus();
	}

	function onMenuPointerDown (event) {
		if (!openMenu) return;
		if (event.target?.closest?.("[data-dropdown]")) return;
		closeDropdown();
	}

	function onMenuResize () {
		closeDropdown();
	}

	function moveMenuFocus (menu, delta) {
		const items = menuItems(menu);
		if (!items.length) return;
		const current = items.indexOf(document.activeElement);
		items[(current + delta + items.length) % items.length].focus();
	}

	function bindDropdown (group) {
		const trigger = triggerFor(group);
		const menu = menuFor(group);
		if (!trigger || !menu) return;
		if (typeof menu.showPopover !== "function") menu.hidden = true;
		trigger.addEventListener("click", () => {
			if (openMenu === group) closeDropdown();
			else openDropdown(group);
		});
		trigger.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
				event.preventDefault();
				if (openMenu === group) closeDropdown({restoreFocus: true});
				else openDropdown(group);
			} else if (event.key === "ArrowDown") {
				event.preventDefault();
				openDropdown(group);
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				openDropdown(group, "last");
			}
		});
		menu.addEventListener("keydown", event => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				closeDropdown({restoreFocus: true});
			} else if (event.key === "ArrowDown") {
				event.preventDefault();
				moveMenuFocus(menu, 1);
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				moveMenuFocus(menu, -1);
			} else if (event.key === "Home") {
				event.preventDefault();
				menuItems(menu)[0]?.focus();
			} else if (event.key === "End") {
				event.preventDefault();
				menuItems(menu).at(-1)?.focus();
			} else if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
				event.preventDefault();
				if (document.activeElement?.closest?.("[data-dropdown]")) document.activeElement.click();
			} else if (event.key === "Tab") {
				closeDropdown();
			}
		});
	}

	function updatePreviewModeButtons () {
		document.querySelectorAll("#preview-mode-group [data-preview]").forEach(button => {
			button.setAttribute("aria-pressed", String(button.dataset.preview === state.view.previewMode));
		});
	}

	function updateInspectionSideButtons () {
		document.querySelectorAll("#inspection-side-group [data-inspect-side]").forEach(button => {
			button.setAttribute("aria-pressed", String(button.dataset.inspectSide === state.view.inspectSide));
		});
	}

	function impliedInspectSide () {
		return state.layout === "backs" ? "back" : "front";
	}

	function resetInspectionSide () {
		state.view.inspectSide = impliedInspectSide();
		state.view.detailSide = state.view.inspectSide;
		updateInspectionSideButtons();
	}

	function setInspectionSide (side) {
		if (side !== "front" && side !== "back") return;
		if (side === state.view.inspectSide) return;
		state.view.inspectSide = side;
		updateInspectionSideButtons();
		buildGallery();
	}

	function buildStrips (selectedItems) {
		if (state.config.flow) {
			const flow = globalThis.CardToolFlow;
			const measure = flow.createMeasure(state.config.page);
			try {
				const context = {
					mode: state.contentMode,
					page: state.config.page,
					maxPanels: flow.maxPanels(state.config.page),
					measure,
				};
				return selectedItems.map(entity => state.config.flow(entity, context));
			} finally {
				measure.dispose();
			}
		}
		const items = selectedItems.flatMap(entity => state.config.expand ? state.config.expand(entity) : [entity]);
		return items.map(entity => ({
			entity,
			span: 1,
			width: 1,
			bucket: "1",
			truncated: false,
			fontPt: null,
			panels: [{index: 0, role: "only", html: state.config.render("front", entity), continuation: false}],
		}));
	}

	function applyGuides (element, cell) {
		if (!cell?.guides) return;
		if (cell.guides.right) element.dataset.guideRight = cell.guides.right;
		if (cell.guides.bottom) element.dataset.guideBottom = cell.guides.bottom;
	}

	function cellHtml (side, cell) {
		if (!cell) return "";
		if (side === "front") return cell.strip.panels[cell.panelIndex]?.html ?? "";
		if (cell.back === "art") return state.config.render("back", cell.strip.entity);
		if (cell.back === "page") return cell.strip.panels[cell.panelIndex]?.html ?? "";
		return "";
	}

	function describeBuckets (plan) {
		const buckets = new Map();
		for (const entry of plan) {
			for (const bucketName of entry.buckets) {
				let bucket = buckets.get(bucketName);
				if (!bucket) {
					bucket = {strips: new Set(), sheets: new Set()};
					buckets.set(bucketName, bucket);
				}
				bucket.sheets.add(entry.sheetIndex);
				for (const cell of entry.cells) {
					if (cell && (cell.strip.bucket ?? "1") === bucketName) bucket.strips.add(cell.strip);
				}
			}
		}
		return buckets;
	}

	function bucketHeading (info, bucket, sheetCount) {
		const count = info?.strips.size ?? 0;
		const sheets = [...(info?.sheets ?? [])].sort((a, b) => a - b);
		const first = sheets[0] ?? 1;
		const last = sheets[sheets.length - 1] ?? first;
		const name = bucket === "truncated" ? "Truncated" : `${bucket}-page cards`;
		const cards = `${count} card${count === 1 ? "" : "s"}`;
		const sheetRange = first === last ? `sheets ${first} of ${sheetCount}` : `sheets ${first}-${last}`;
		let label = `${name} — ${cards}, ${sheetRange}`;
		if (state.layout === "both") {
			const firstPage = first * 2 - 1;
			const lastPage = last * 2;
			label += firstPage === lastPage ? `, page ${firstPage}` : `, pages ${firstPage}-${lastPage}`;
		}
		return label;
	}

	function applyPageLayout (page) {
		const isPortrait = state.config.page.orientation === "portrait";
		page.style.setProperty("--page-columns", state.config.page.columns);
		page.style.setProperty("--page-rows", state.config.page.rows);
		page.style.setProperty("--page-width", isPortrait ? "210mm" : "297mm");
		page.style.setProperty("--page-height", isPortrait ? "297mm" : "210mm");
		page.style.aspectRatio = isPortrait ? "210 / 297" : "297 / 210";
	}

	function createPageUnit (entry, sheetCount) {
		const unit = document.createElement("div");
		unit.className = "page-unit";
		unit.dataset.sheet = entry.sheetIndex;
		unit.dataset.side = entry.side;
		const label = document.createElement("div");
		label.className = "page-label";
		label.textContent = `Sheet ${entry.sheetIndex} of ${sheetCount} - ${entry.side === "back" ? "Backs" : "Fronts"}`;
		const screenPage = document.createElement("div");
		screenPage.className = "screen-page";
		applyPageLayout(screenPage);
		const printPage = document.createElement("div");
		printPage.className = "page";
		applyPageLayout(printPage);
		unit.append(label, screenPage);
		return {unit, screenPage, printPage};
	}

	function recordPrintCard (record, side, cell, element) {
		if (!cell?.strip) return;
		const entry = record.get(cell.strip) ?? {front: new Map(), back: new Map()};
		entry[side].set(cell.panelIndex, element);
		record.set(cell.strip, entry);
	}

	function createPrintPage (entry) {
		const printPage = document.createElement("div");
		printPage.className = "page";
		applyPageLayout(printPage);
		entry.cells.forEach(cell => {
			const printCard = document.createElement("div");
			printCard.className = `card${cell ? "" : " empty"}`;
			applyGuides(printCard, cell);
			printCard.innerHTML = cellHtml(entry.side, cell);
			printPage.appendChild(printCard);
			recordPrintCard(state.printCards, entry.side, cell, printCard);
		});
		return printPage;
	}

	function buildPreview () {
		const selectedItems = [...state.selected.values()].sort((a, b) => state.config.sort(a, b, $("sort").value));
		const strips = buildStrips(selectedItems);
		const plan = pagePlan.buildPagePlan(strips, state.config.page, state.layout);
		state.plan = plan;
		state.inspectPlan = pagePlan.buildPagePlan(strips, state.config.page, "both");
		state.strips = strips;
		state.recorded = {signature: planSignature(), side: null};
		const sheetCount = plan.reduce((count, entry) => Math.max(count, entry.sheetIndex), 0);
		const grid = $("preview-grid");
		const gallery = $("cards-gallery");
		const print = $("print-area");
		grid.innerHTML = "";
		gallery.innerHTML = "";
		print.innerHTML = "";
		state.printCards.clear();
		const buckets = describeBuckets(plan);
		const showHeadings = state.contentMode === "overflow";
		const headingSlots = showHeadings ? pagePlan.bucketHeadingSlots(plan) : [];
		const pairHosts = new Map();
		plan.forEach((entry, index) => {
			for (const bucketName of headingSlots[index] ?? []) {
				const heading = document.createElement("h2");
				heading.className = "bucket-heading";
				heading.textContent = bucketHeading(buckets.get(bucketName), bucketName, sheetCount);
				grid.appendChild(heading);
			}
			const {unit, screenPage, printPage} = createPageUnit(entry, sheetCount);
			if (state.layout === "both") {
				let pair = pairHosts.get(entry.sheetIndex);
				if (!pair) {
					pair = document.createElement("div");
					pair.className = "sheet-pair";
					pair.dataset.sheet = entry.sheetIndex;
					pairHosts.set(entry.sheetIndex, pair);
					grid.appendChild(pair);
				}
				pair.appendChild(unit);
			} else {
				grid.appendChild(unit);
			}
			entry.cells.forEach(cell => {
				const screenCard = document.createElement("div");
				screenCard.className = `screen-card${cell ? "" : " empty"}`;
				applyGuides(screenCard, cell);
				screenCard.innerHTML = cellHtml(entry.side, cell);
				screenPage.appendChild(screenCard);
				const printCard = document.createElement("div");
				printCard.className = `card${cell ? "" : " empty"}`;
				applyGuides(printCard, cell);
				printCard.innerHTML = cellHtml(entry.side, cell);
				printPage.appendChild(printCard);
				recordPrintCard(state.printCards, entry.side, cell, printCard);
			});
			print.appendChild(printPage);
		});
		updateLayoutButtons();
		updateContentButtons();
		updateDensityButtons();
		$("placeholder").hidden = true;
		$("screen-pages").hidden = false;
		$("print-actions").hidden = false;
		applyGridMetrics();
		fitRenderedCards(grid);
		fitRenderedCards(print);
		buildGallery();
		updatePreviewModeVisibility();
		if (frame) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			frame = 0;
			updateGalleryScale();
		});
	}

	function pageGeometry () {
		return layoutTool.PAGE_GEOMETRY[state.config.page.orientation === "portrait" ? "portrait" : "landscape"];
	}

	function planSignature () {
		return JSON.stringify({
			ids: [...state.selected.keys()].sort(),
			sort: $("sort").value,
			contentMode: state.contentMode,
			page: state.config.page,
		});
	}

	function printRendersSide (side) {
		return state.plan.some(entry => entry?.side === side);
	}

	function inspectionHasSide (strip, side) {
		return state.inspectPlan.some(entry => entry?.side === side
			&& (entry.cells ?? []).some(cell => cell?.strip === strip));
	}

	// Render one side of the inspection plan without touching the print document: the pages
	// live in a detached record pass, get fitted, fill `state.printCards`, and are removed.
	function recordSide (side) {
		const print = $("print-area");
		const layout = side === "back" ? "backs" : "fronts";
		const pages = [];
		for (const entry of pagePlan.buildPagePlan(state.strips, state.config.page, layout)) {
			const page = createPrintPage(entry);
			page.dataset.recordOnly = "true";
			print.appendChild(page);
			pages.push(page);
		}
		fitRenderedCards(print);
		for (const page of pages) page.remove();
	}

	// The inspection plan always holds both sides; the print plan may hold only one. Record
	// the missing side on first demand and cache it until the next plan build.
	function ensureInspectionSide (side) {
		if (!state.inspectPlan.length) return false;
		if (printRendersSide(side)) return true;
		const signature = planSignature();
		if (state.recorded.side === side && state.recorded.signature === signature) return true;
		state.recorded = {signature, side: null};
		recordSide(side);
		state.recorded = {signature, side};
		return true;
	}

	function ensureDetailSide (item, side) {
		ensureInspectionSide(side);
		// A front view stacks every panel of the logical card, including a continuation panel
		// that lands on the sheet back, so a multi-panel card also needs the recorded back.
		if (side === "front" && item.panels > 1) ensureInspectionSide("back");
	}

	function printCardSize () {
		const geometry = pageGeometry();
		const columns = Math.max(1, state.config.page.columns || geometry.columns);
		const rows = Math.max(1, state.config.page.rows || geometry.rows);
		const width = geometry.widthMm * layoutTool.MM_TO_PX / columns;
		const height = width * (geometry.heightMm / rows) / (geometry.widthMm / columns);
		return {width, height};
	}

	function availablePreviewSize () {
		const wrap = $("preview-wrap");
		const style = getComputedStyle(wrap);
		const width = wrap.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
		const height = wrap.clientHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
		return {availableWidth: Math.max(0, width), availableHeight: Math.max(0, height)};
	}

	function applyGridMetrics () {
		if (!state.plan.length || !state.config) return;
		const grid = $("preview-grid");
		const result = layoutTool.computePreviewGrid({
			...availablePreviewSize(),
			page: state.config.page,
			layout: state.layout,
			density: state.view.density,
			pageCount: state.plan.length,
		});
		state.grid = result;
		grid.style.setProperty("--grid-cols", String(result.cols));
		grid.style.setProperty("--page-w", `${result.pageW}px`);
		grid.style.setProperty("--page-h", `${result.pageH}px`);
		grid.classList.toggle("paired", Boolean(result.paired));
		grid.classList.toggle("stacked", Boolean(result.stacked));
		grid.querySelectorAll(".sheet-pair").forEach(pair => pair.classList.toggle("stacked", Boolean(result.stacked)));
	}

	function scheduleGridMetrics () {
		if (frame) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			frame = 0;
			applyGridMetrics();
			updateGalleryScale();
		});
	}

	function updateGalleryScale () {
		const gallery = $("cards-gallery");
		const sample = gallery.querySelector(".gallery-card");
		if (!sample) return;
		const width = sample.getBoundingClientRect().width;
		const cardW = parseFloat(gallery.style.getPropertyValue("--card-w")) || printCardSize().width;
		if (!width || !cardW) return;
		gallery.style.setProperty("--gallery-scale", String(width / cardW));
	}

	function galleryCardFor (tile) {
		const record = state.printCards.get(tile.strip);
		const sideMap = tile.side === "back" ? record?.back : record?.front;
		if (!sideMap?.size) return null;
		if (sideMap.has(0)) return sideMap.get(0);
		return [...sideMap.entries()].sort((left, right) => left[0] - right[0])[0][1];
	}

	function galleryTotalSheets () {
		return state.inspectPlan.reduce((count, entry) => Math.max(count, entry.sheetIndex), 0);
	}

	function buildGallery () {
		const gallery = $("cards-gallery");
		const cards = printCardSize();
		gallery.style.setProperty("--card-w", `${cards.width}px`);
		gallery.style.setProperty("--card-h", `${cards.height}px`);
		gallery.style.setProperty("--card-aspect", String(cards.width / cards.height));
		gallery.innerHTML = "";
		ensureInspectionSide(state.view.inspectSide);
		const groups = layoutTool.galleryGroups(state.inspectPlan, state.view.inspectSide);
		const sequence = layoutTool.detailSequence(state.inspectPlan);
		const positions = new Map(sequence.map((item, index) => [item.strip, index]));
		const sheetCount = galleryTotalSheets();
		if (!groups.length) {
			const empty = document.createElement("p");
			empty.className = "gallery-empty";
			empty.textContent = "No cards to preview.";
			gallery.appendChild(empty);
			return;
		}
		for (const group of groups) {
			const section = document.createElement("section");
			section.className = "gallery-group";
			const heading = document.createElement("h3");
			heading.className = "gallery-heading";
			heading.textContent = `Sheet ${group.sheetIndex} of ${sheetCount} - ${group.label}`;
			const grid = document.createElement("div");
			grid.className = "gallery-grid";
			for (const tile of group.tiles) {
				const source = galleryCardFor(tile);
				const button = document.createElement("button");
				button.type = "button";
				button.className = "gallery-card";
				button.dataset.detailIndex = String(positions.get(tile.strip) ?? 0);
				button.setAttribute("aria-label", `${tile.strip.entity.name}, ${tile.panels} panel${tile.panels === 1 ? "" : "s"}, sheet ${group.sheetIndex} ${group.label}. Open card.`);
				const scale = document.createElement("span");
				scale.className = "gallery-scale";
				if (source) scale.appendChild(source.cloneNode(true));
				const badge = document.createElement("span");
				badge.className = "gallery-badge";
				badge.textContent = `${tile.panels} panel${tile.panels === 1 ? "" : "s"}`;
				badge.hidden = tile.panels <= 1;
				const expand = document.createElement("span");
				expand.className = "gallery-expand";
				expand.setAttribute("aria-hidden", "true");
				expand.textContent = "⤢";
				button.append(scale, badge, expand);
				grid.appendChild(button);
			}
			section.append(heading, grid);
			gallery.appendChild(section);
		}
	}

	function updatePreviewModeVisibility () {
		const cards = state.view.previewMode === "cards";
		$("cards-gallery").hidden = !cards;
		$("pages-canvas").hidden = cards;
		const sideGroup = $("inspection-side-group");
		if (sideGroup) sideGroup.hidden = !cards;
		updatePreviewModeButtons();
		updateInspectionSideButtons();
	}

	function setPreviewMode (mode) {
		if (mode !== "cards" && mode !== "pages") return;
		if (mode === state.view.previewMode) return;
		if (state.view.previewMode === "pages") resetPagesZoom();
		const wrap = $("preview-wrap");
		if (state.view.previewMode === "cards") state.galleryScroll.cards = wrap.scrollTop;
		else state.galleryScroll.pages = wrap.scrollTop;
		state.view.previewMode = mode;
		updatePreviewModeVisibility();
		requestAnimationFrame(() => {
			wrap.scrollTop = mode === "cards" ? state.galleryScroll.cards : state.galleryScroll.pages;
			updateGalleryScale();
		});
	}

	function hidePreview () {
		closeDropdown();
		resetPagesZoom();
		$("placeholder").hidden = false;
		$("screen-pages").hidden = true;
		$("print-actions").hidden = true;
		$("print-area").innerHTML = "";
		$("preview-grid").innerHTML = "";
		$("cards-gallery").innerHTML = "";
		document.body.classList.remove("print-debug");
		document.body.classList.remove("no-bg-graphics");
		state.plan = [];
		state.inspectPlan = [];
		state.strips = [];
		state.printCards.clear();
		state.recorded = {signature: "", side: null};
		state.layout = "fronts";
		state.view.detailIndex = null;
		resetInspectionSide();
		closeDetail();
		updateLayoutButtons();
		updateContentButtons();
		updateDensityButtons();
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
		const statblock = title.closest(".beast-statblock");
		const bodyPt = Number.parseFloat(getComputedStyle(statblock ?? title).getPropertyValue("--beast-body-pt")) || 11;
		const startPt = Math.min(14, bodyPt * 1.27);
		const minPt = Math.max(8.8, bodyPt * 0.9);
		title.style.whiteSpace = "nowrap";
		title.style.fontSize = `${startPt}pt`;
		const availableWidth = title.clientWidth || title.parentElement?.clientWidth || 353;
		const clone = title.cloneNode(true);
		clone.style.cssText = "position:fixed;left:-10000px;white-space:nowrap;width:max-content;visibility:hidden";
		document.body.appendChild(clone);
		const fits = text => {
			clone.textContent = text;
			return clone.offsetWidth <= availableWidth;
		};
		while (parseFloat(title.style.fontSize) > minPt && !fits(title.textContent)) title.style.fontSize = `${Math.max(minPt, parseFloat(title.style.fontSize) - 0.25)}pt`;
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
			const startPt = Number(inner.dataset.contentPt) || fit.description.defaultPt;
			const startLineHeight = Number(body.style.lineHeight) || fit.description.defaultLineHeight;
			body.style.fontSize = `${startPt}pt`;
			body.style.lineHeight = startLineHeight;
			while (fit.description.minPt < parseFloat(body.style.fontSize) && hasOverflow(inner)) {
				const size = Math.max(fit.description.minPt, parseFloat(body.style.fontSize) - fit.description.stepPt);
				const progress = startPt <= fit.description.minPt ? 1 : (startPt - size) / (startPt - fit.description.minPt);
				body.style.fontSize = `${size}pt`;
				body.style.lineHeight = (startLineHeight - (startLineHeight - fit.description.minLineHeight) * progress).toFixed(3);
			}
		});
		if (isPrint) root.classList.remove("fit-measure");
	}

	function entityNoun () {
		return state.config.entityLabel.replace(/s$/i, "").toLowerCase();
	}

	function readBookStore (key) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return {ok: true, value: {}};
			const value = JSON.parse(raw);
			if (!value || typeof value !== "object" || Array.isArray(value)) return {ok: false, value: {}, reason: "Saved cardbooks in this browser cannot be read."};
			return {ok: true, value};
		} catch (error) {
			return {ok: false, value: {}, reason: "Saved cardbooks in this browser cannot be read."};
		}
	}

	function readBookEntry (raw, name) {
		const options = {pageType: state.config.type, name};
		return typeof raw === "string" ? cardbooks.parseBook(raw, options) : cardbooks.readBook(raw, options);
	}

	function listBooks () {
		const keys = [{key: cardbooks.bookKey(state.config.type), legacy: false}];
		if (state.config.type === "spell") keys.push({key: cardbooks.LEGACY_SPELL_KEY, legacy: true});
		const seen = new Set();
		const books = [];
		const unreadable = [];
		let storeError = "";
		for (const {key, legacy} of keys) {
			const store = readBookStore(key);
			if (!store.ok) {
				storeError = store.reason;
				continue;
			}
			for (const [name, raw] of Object.entries(store.value)) {
				// The modern key wins when the same name exists in both keys.
				if (seen.has(name)) continue;
				seen.add(name);
				const result = readBookEntry(raw, name);
				if (result.ok) books.push({name, book: result.book, legacy: Boolean(result.legacy) || Boolean(legacy)});
				else unreadable.push({name, reason: result.reason});
			}
		}
		books.sort((left, right) => left.name.localeCompare(right.name));
		unreadable.sort((left, right) => left.name.localeCompare(right.name));
		return {books, unreadable, storeError};
	}

	function setSaveStatus (message, tone = "") {
		const status = $("save-book-status");
		status.textContent = message;
		if (tone) status.dataset.tone = tone;
		else delete status.dataset.tone;
	}

	function resetSaveConfirm () {
		const button = $("save-book-confirm");
		button.textContent = "Save";
		button.classList.remove("confirming");
		state.view.saveConfirm = null;
	}

	function setLoadStatus (message, tone = "") {
		const status = $("load-book-status");
		status.textContent = message;
		if (tone) status.dataset.tone = tone;
		else delete status.dataset.tone;
	}

	function resetLoadConfirm () {
		if (loadConfirm?.button?.isConnected) {
			loadConfirm.button.textContent = "Replace";
			loadConfirm.button.classList.remove("confirming");
			loadConfirm.button.closest(".book-row")?.classList.remove("confirming");
		}
		loadConfirm = null;
		state.view.loadConfirm = null;
	}

	function updateSaveState () {
		const button = $("save-book-confirm");
		const name = $("save-book-name").value.trim();
		resetSaveConfirm();
		if (!state.selected.size) {
			button.disabled = true;
			setSaveStatus(`Select at least one ${entityNoun()} before saving.`, "error");
			return;
		}
		button.disabled = !name;
		if (!name) {
			setSaveStatus("Enter a name for this cardbook.", "error");
			return;
		}
		const store = readBookStore(cardbooks.bookKey(state.config.type));
		if (!store.ok) {
			setSaveStatus(`${store.reason} This cardbook cannot be saved until storage is readable.`, "error");
			return;
		}
		if (Object.prototype.hasOwnProperty.call(store.value, name)) {
			setSaveStatus(`A cardbook named "${name}" already exists. Activate Save again to replace it.`, "warn");
			return;
		}
		setSaveStatus("");
	}

	function openSave (trigger) {
		saveReturnFocus = trigger ?? document.activeElement;
		$("save-book-name").value = `${state.config.entityLabel} Collection`;
		const dialog = $("save-book-dialog");
		if (!dialog.open) dialog.showModal();
		updateSaveState();
		const input = $("save-book-name");
		input.focus();
		input.select();
	}

	function closeSave () {
		const dialog = $("save-book-dialog");
		if (dialog.open) dialog.close();
	}

	function deferFocus (element) {
		if (!element?.isConnected) return;
		// The platform restores focus to the pre-modal element after the close event; defer so
		// the recorded opener wins even when the dialog was opened programmatically.
		setTimeout(() => {
			if (element.isConnected) element.focus();
		}, 0);
	}

	function saveBook () {
		const button = $("save-book-confirm");
		const name = $("save-book-name").value.trim();
		if (!state.selected.size) {
			button.disabled = true;
			setSaveStatus(`Select at least one ${entityNoun()} before saving.`, "error");
			return;
		}
		if (!name) {
			button.disabled = true;
			setSaveStatus("Enter a name for this cardbook.", "error");
			return;
		}
		const store = readBookStore(cardbooks.bookKey(state.config.type));
		if (!store.ok) {
			setSaveStatus(`${store.reason} This cardbook was not saved.`, "error");
			return;
		}
		if (Object.prototype.hasOwnProperty.call(store.value, name) && state.view.saveConfirm !== name) {
			state.view.saveConfirm = name;
			button.textContent = "Confirm replace";
			button.classList.add("confirming");
			setSaveStatus(`A cardbook named "${name}" already exists. Activate Save again to replace it.`, "warn");
			return;
		}
		const cards = selectedEntities().map(entity => ({type: state.config.type, name: entity.name, source: entity.source}));
		const next = {...store.value, [name]: {format: cardbooks.CARD_BOOK_FORMAT, name, cards}};
		try {
			localStorage.setItem(cardbooks.bookKey(state.config.type), JSON.stringify(next));
		} catch (error) {
			setSaveStatus(`Could not save "${name}": ${error?.message || "browser storage rejected the write"}.`, "error");
			return;
		}
		resetSaveConfirm();
		button.disabled = false;
		setSaveStatus(`Saved "${name}" with ${cards.length} card${cards.length === 1 ? "" : "s"}.`, "ok");
	}

	function renderLoad () {
		const {books, unreadable, storeError} = listBooks();
		const summary = $("load-book-summary");
		const list = $("load-book-list");
		list.innerHTML = "";
		resetLoadConfirm();
		if (storeError) {
			summary.textContent = storeError;
			summary.dataset.tone = "error";
		} else if (unreadable.length) {
			summary.textContent = `${unreadable.length} saved cardbook${unreadable.length === 1 ? " has" : "s have"} unreadable data and cannot be loaded.`;
			summary.dataset.tone = "warn";
		} else if (books.length) {
			summary.textContent = `${books.length} saved cardbook${books.length === 1 ? "" : "s"} for ${state.config.entityLabel.toLowerCase()}.`;
			delete summary.dataset.tone;
		} else {
			summary.textContent = "";
			delete summary.dataset.tone;
		}
		if (!books.length && !unreadable.length && !storeError) {
			const empty = document.createElement("p");
			empty.className = "manager-empty";
			empty.textContent = `No saved ${entityNoun()} cardbooks yet. Use Save to store a selection.`;
			list.appendChild(empty);
			return;
		}
		for (const entry of books) {
			const row = document.createElement("div");
			row.className = "book-row";
			const copy = document.createElement("div");
			copy.className = "book-copy";
			const title = document.createElement("strong");
			title.textContent = entry.name;
			const meta = document.createElement("small");
			const count = entry.book.cards.length;
			meta.textContent = `${count} card${count === 1 ? "" : "s"}${entry.legacy ? " · legacy spellbook" : ""}`;
			copy.append(title, meta);
			const actions = document.createElement("div");
			actions.className = "book-actions";
			const add = document.createElement("button");
			add.type = "button";
			add.className = "btn";
			add.textContent = "Add";
			add.setAttribute("aria-label", `Add ${entry.name}`);
			add.addEventListener("click", () => {
				resetLoadConfirm();
				applyBook(entry, "add");
			});
			const replace = document.createElement("button");
			replace.type = "button";
			replace.className = "btn";
			replace.textContent = "Replace";
			replace.setAttribute("aria-label", `Replace the selection with ${entry.name}`);
			replace.addEventListener("click", () => requestReplace(entry, replace));
			actions.append(add, replace);
			row.append(copy, actions);
			list.appendChild(row);
		}
		for (const entry of unreadable) {
			const row = document.createElement("div");
			row.className = "book-row";
			const copy = document.createElement("div");
			copy.className = "book-copy";
			const title = document.createElement("strong");
			title.textContent = entry.name;
			const meta = document.createElement("small");
			meta.textContent = `Unreadable · ${entry.reason}`;
			copy.append(title, meta);
			row.append(copy);
			list.appendChild(row);
		}
	}

	function openLoad (trigger) {
		loadReturnFocus = trigger ?? document.activeElement;
		setLoadStatus("");
		renderLoad();
		const dialog = $("load-book-dialog");
		if (!dialog.open) dialog.showModal();
		const target = $("load-book-list").querySelector("button") ?? $("load-book-dialog").querySelector("[data-close-load]");
		target?.focus();
	}

	function closeLoad () {
		const dialog = $("load-book-dialog");
		if (!dialog.open) return;
		dialog.close();
	}

	function requestReplace (entry, button) {
		if (loadConfirm?.button === button) {
			resetLoadConfirm();
			applyBook(entry, "replace");
			return;
		}
		resetLoadConfirm();
		// A card "absent from the book" is compared against the stored references, not the
		// resolved set: an unmatched reference is still part of the book.
		const bookIds = new Set(entry.book.cards.map(ref => cardbooks.referenceId(ref)));
		const discarded = [...state.selected.keys()].filter(id => !bookIds.has(id)).length;
		if (!discarded) {
			applyBook(entry, "replace");
			return;
		}
		loadConfirm = {name: entry.name, button};
		state.view.loadConfirm = entry.name;
		button.textContent = "Confirm replace";
		button.classList.add("confirming");
		button.closest(".book-row")?.classList.add("confirming");
		setLoadStatus(`Replacing will discard ${discarded} selected card${discarded === 1 ? "" : "s"} that are not in "${entry.name}". Activate Confirm replace to continue.`, "warn");
	}

	function applyBook (entry, mode) {
		const lookup = cardbooks.entityLookup(state.all, state.config.type);
		const {resolved, unmatched} = cardbooks.resolveCards(entry.book, lookup);
		const total = entry.book.cards.length;
		const unmatchedNote = unmatched.length === total
			? `All ${total} stored reference${total === 1 ? "" : "s"} could not be found.`
			: `${unmatched.length} of ${total} stored reference${total === 1 ? "" : "s"} could not be found.`;
		if (mode === "add" && !resolved.length) {
			setLoadStatus(`No cards from "${entry.name}" could be found. ${unmatchedNote} Nothing was added.`, "error");
			return;
		}
		if (mode === "replace") state.selected.clear();
		let added = 0;
		for (const entity of resolved) {
			const id = idOf(entity);
			if (state.selected.has(id)) continue;
			state.selected.set(id, entity);
			added++;
		}
		updateSelection();
		const parts = [mode === "replace"
			? `Replaced the selection with ${resolved.length} card${resolved.length === 1 ? "" : "s"} from "${entry.name}".`
			: added
				? `Added ${added} card${added === 1 ? "" : "s"} from "${entry.name}".`
				: `All ${resolved.length} matching card${resolved.length === 1 ? " was" : "s were"} already selected; nothing was added from "${entry.name}".`];
		if (unmatched.length) parts.push(unmatchedNote);
		setLoadStatus(parts.join(" "), unmatched.length ? "warn" : "ok");
		// A clean load needs no report, so close and return focus to the Load control.
		// A load with unmatched references keeps the dialog open to show the report.
		if (!unmatched.length) closeLoad();
	}

	function setDensity (density) {
		if (!["auto", "large", "grid"].includes(density)) return;
		state.view.density = density;
		updateDensityButtons();
		applyGridMetrics();
	}

	function selectedEntities () {
		return [...state.selected.values()].sort((a, b) => state.config.sort(a, b, $("sort").value));
	}

	function renderManager () {
		const all = selectedEntities();
		const matches = layoutTool.filterSelection(all, state.view.manageQuery, state.config.listMeta);
		$("manager-title").textContent = `Manage selection (${all.length})`;
		$("manager-count").textContent = `${matches.length} of ${all.length} shown`;
		const list = $("manager-list");
		list.innerHTML = "";
		if (!matches.length) {
			const empty = document.createElement("p");
			empty.className = "manager-empty";
			empty.textContent = all.length ? "No selected cards match this search." : "No cards selected.";
			list.appendChild(empty);
			return;
		}
		for (const entity of matches) {
			const id = idOf(entity);
			const row = document.createElement("div");
			row.className = "manager-row";
			row.innerHTML = `<span class="entity-dot" style="background:${esc(state.config.color(entity))}"></span><span class="entity-copy"><strong>${esc(entity.name)}</strong><small>${esc(state.config.listMeta(entity))}</small></span>`;
			const remove = document.createElement("button");
			remove.type = "button";
			remove.setAttribute("aria-label", `Remove ${entity.name}`);
			remove.textContent = "×";
			remove.addEventListener("click", () => {
				state.selected.delete(id);
				updateSelection();
			});
			row.appendChild(remove);
			list.appendChild(row);
		}
	}

	function resetClearConfirm () {
		state.view.manageConfirm = false;
		const button = $("manager-clear");
		button.textContent = "Clear all";
		button.classList.remove("confirming");
	}

	function openManager (trigger) {
		managerReturnFocus = trigger ?? document.activeElement;
		state.view.manageQuery = "";
		$("manager-search").value = "";
		resetClearConfirm();
		renderManager();
		setSurface("selected");
		const dialog = $("selection-manager");
		if (!dialog.open) dialog.showModal();
		$("manager-search").focus();
	}

	function closeManager () {
		const dialog = $("selection-manager");
		if (dialog.open) dialog.close();
	}

	function openPrintSheet () {
		if (!isPhone()) return;
		syncWorkspaceActions();
		setSurface("print");
		const dialog = $("print-sheet");
		if (!dialog.open) dialog.showModal();
	}

	function closePrintSheet () {
		const dialog = $("print-sheet");
		if (dialog.open) dialog.close();
	}

	function openBrowse () {
		setSurface("browse");
		$("query").focus();
	}

	function closeBrowse () {
		if (state.view.surface === "browse") setSurface(null);
	}

	function setSurface (surface) {
		state.view.surface = surface;
		if (surface) document.body.dataset.surface = surface;
		else delete document.body.dataset.surface;
	}

	function syncWorkspaceActions () {
		const actions = document.querySelector(".workspace-actions");
		if (!actions) return;
		const host = isPhone() ? $("print-sheet-slot") : $("workspace-bar");
		if (actions.parentElement !== host) host.appendChild(actions);
	}

	function detailSequence () {
		return layoutTool.detailSequence(state.inspectPlan);
	}

	function openDetail (index) {
		const sequence = detailSequence();
		if (!sequence[index]) return;
		state.view.detailIndex = index;
		// The detail view opens on the side the gallery is showing; flipping stays local.
		state.view.detailSide = state.view.inspectSide;
		detailZoom = 1;
		renderDetail();
		setSurface("detail");
		const dialog = $("card-detail");
		if (!dialog.open) dialog.showModal();
	}

	function closeDetail () {
		const dialog = $("card-detail");
		if (dialog.open) dialog.close();
	}

	function detailCardFor (item, side) {
		const record = state.printCards.get(item.strip);
		const sideMap = side === "back" ? record?.back : record?.front;
		if (!sideMap?.size) return [];
		const entries = new Map(sideMap);
		if (side !== "back" && record?.back) {
			for (const [panelIndex, element] of record.back) {
				if (entries.has(panelIndex)) continue;
				if (element.classList.contains("empty")) continue;
				if (element.querySelector(".back-card") || !element.querySelector(".entity-card")) continue;
				entries.set(panelIndex, element);
			}
		}
		return [...entries.entries()]
			.filter(([, element]) => !element.classList.contains("empty"))
			.sort((left, right) => left[0] - right[0]);
	}

	function canFlipStrip (strip) {
		const record = state.printCards.get(strip);
		if (!record) return false;
		const other = state.view.detailSide === "back" ? "front" : "back";
		const prepared = Boolean(record[other]?.size);
		// Availability comes from the prepared cards: the strip must have a rendered side, and
		// the inspection plan must place it on the other side. The unseen side is recorded on
		// first flip; the print layout's side flags never decide this.
		return Boolean(record.front?.size || record.back?.size)
			&& (prepared || inspectionHasSide(strip, other));
	}

	function renderDetail () {
		const sequence = detailSequence();
		const item = sequence[state.view.detailIndex];
		if (!item) return;
		const side = state.view.detailSide;
		ensureDetailSide(item, side);
		$("detail-position").textContent = `${state.view.detailIndex + 1} of ${sequence.length}`;
		const canFlip = canFlipStrip(item.strip);
		$("detail-flip").hidden = !canFlip;
		$("detail-flip").textContent = side === "back" ? "Front" : "Back";
		$("detail-prev").disabled = state.view.detailIndex <= 0;
		$("detail-next").disabled = state.view.detailIndex >= sequence.length - 1;
		const stack = $("detail-stack");
		stack.innerHTML = "";
		stack.style.transform = "";
		const cards = detailCardFor(item, side);
		const size = printCardSize();
		const available = Math.max(120, window.innerWidth - 32);
		const scale = Math.min(1, available / size.width);
		stack.style.setProperty("--detail-card-w", `${size.width}px`);
		stack.style.setProperty("--detail-card-h", `${size.height}px`);
		stack.style.setProperty("--detail-scale", String(scale));
		if (!cards.length) {
			const empty = document.createElement("p");
			empty.className = "manager-empty";
			empty.textContent = "This card has no preview for the active side.";
			stack.appendChild(empty);
			return;
		}
		for (const [panelIndex, source] of cards) {
			const panel = document.createElement("div");
			panel.className = "detail-panel";
			if (cards.length > 1 || item.panels > 1) {
				const label = document.createElement("span");
				label.className = "detail-panel-label";
				label.textContent = `Panel ${panelIndex + 1} of ${item.panels}`;
				panel.appendChild(label);
			}
			const scaleHost = document.createElement("div");
			scaleHost.className = "detail-scale";
			scaleHost.appendChild(source.cloneNode(true));
			panel.appendChild(scaleHost);
			stack.appendChild(panel);
		}
	}

	function stepDetail (delta) {
		const sequence = detailSequence();
		const next = state.view.detailIndex + delta;
		if (next < 0 || next >= sequence.length) return;
		state.view.detailIndex = next;
		detailZoom = 1;
		renderDetail();
		$("detail-scroll").scrollTop = 0;
	}

	function flipDetail () {
		state.view.detailSide = state.view.detailSide === "back" ? "front" : "back";
		renderDetail();
	}

	function bindGallery () {
		const gallery = $("cards-gallery");
		gallery.addEventListener("pointerdown", event => {
			const tile = event.target.closest(".gallery-card");
			if (!tile) return;
			galleryPress = {x: event.clientX, y: event.clientY, tile};
		});
		gallery.addEventListener("pointerup", event => {
			if (!galleryPress) return;
			const dx = event.clientX - galleryPress.x;
			const dy = event.clientY - galleryPress.y;
			if (Math.hypot(dx, dy) > 10) suppressGalleryClick = true;
			galleryPress = null;
		});
		gallery.addEventListener("pointercancel", () => {
			galleryPress = null;
		});
		gallery.addEventListener("click", event => {
			const tile = event.target.closest(".gallery-card");
			if (!tile) return;
			if (suppressGalleryClick) {
				suppressGalleryClick = false;
				return;
			}
			const index = Number(tile.dataset.detailIndex);
			if (Number.isFinite(index)) openDetail(index);
		});
	}

	function bindPagesZoom () {
		const canvas = $("pages-canvas");
		const grid = $("preview-grid");
		const pointers = new Map();
		let pinch = null;
		let zoom = 1;
		const distance = () => {
			const [first, second] = [...pointers.values()];
			return Math.hypot(first.x - second.x, first.y - second.y);
		};
		resetPagesZoom = () => {
			pointers.clear();
			pinch = null;
			zoom = 1;
			grid.style.transform = "";
			grid.style.transformOrigin = "";
		};
		canvas.addEventListener("pointerdown", event => {
			pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
			if (pointers.size === 2) pinch = {distance: distance(), zoom};
		});
		canvas.addEventListener("pointermove", event => {
			if (!pointers.has(event.pointerId)) return;
			pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
			if (pointers.size !== 2 || !pinch || !pinch.distance) return;
			const [first, second] = [...pointers.values()];
			const rect = grid.getBoundingClientRect();
			grid.style.transformOrigin = `${(first.x + second.x) / 2 - rect.left}px ${(first.y + second.y) / 2 - rect.top}px`;
			zoom = Math.min(4, Math.max(1, pinch.zoom * distance() / pinch.distance));
			grid.style.transform = `scale(${zoom})`;
			event.preventDefault();
		});
		const release = event => {
			pointers.delete(event.pointerId);
			if (pointers.size < 2) pinch = null;
			if (!pointers.size && zoom < 1.05) {
				zoom = 1;
				grid.style.transform = "";
			}
		};
		canvas.addEventListener("pointerup", release);
		canvas.addEventListener("pointercancel", release);
	}

	function bindDetailGestures () {		const scroll = $("detail-scroll");
		scroll.addEventListener("pointerdown", event => {
			detailPointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
			if (detailPointers.size === 1) {
				detailSwipe = {x: event.clientX, y: event.clientY, id: event.pointerId};
			}
			if (detailPointers.size === 2) {
				const [first, second] = [...detailPointers.values()];
				detailPinch = {distance: Math.hypot(first.x - second.x, first.y - second.y), zoom: detailZoom};
			}
		});
		scroll.addEventListener("pointermove", event => {
			if (!detailPointers.has(event.pointerId)) return;
			detailPointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
			if (detailPointers.size === 2 && detailPinch && detailPinch.distance > 0) {
				const [first, second] = [...detailPointers.values()];
				const distance = Math.hypot(first.x - second.x, first.y - second.y);
				detailZoom = Math.min(4, Math.max(1, detailPinch.zoom * distance / detailPinch.distance));
				$("detail-stack").style.transform = `scale(${detailZoom})`;
				event.preventDefault();
			}
		});
		const release = event => {
			if (detailSwipe && event.pointerId === detailSwipe.id) {
				const dx = event.clientX - detailSwipe.x;
				const dy = event.clientY - detailSwipe.y;
				if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4 && detailPointers.size < 2) stepDetail(dx < 0 ? 1 : -1);
				detailSwipe = null;
			}
			detailPointers.delete(event.pointerId);
			if (detailPointers.size < 2) detailPinch = null;
		};
		scroll.addEventListener("pointerup", release);
		scroll.addEventListener("pointercancel", release);
	}

	function bindDialogs () {
		$("selection-count-trigger").addEventListener("click", event => openManager(event.currentTarget));
		document.querySelectorAll("[data-close-manager]").forEach(button => button.addEventListener("click", closeManager));
		$("manager-search").addEventListener("input", event => {
			state.view.manageQuery = event.target.value;
			renderManager();
		});
		$("manager-remove-shown").addEventListener("click", () => {
			const all = selectedEntities();
			const matches = layoutTool.filterSelection(all, state.view.manageQuery, state.config.listMeta);
			matches.forEach(entity => state.selected.delete(idOf(entity)));
			updateSelection();
		});
		$("manager-clear").addEventListener("click", () => {
			if (!state.view.manageConfirm) {
				state.view.manageConfirm = true;
				const button = $("manager-clear");
				button.textContent = "Confirm clear";
				button.classList.add("confirming");
				return;
			}
			resetClearConfirm();
			state.selected.clear();
			updateSelection();
		});
		$("selection-manager").addEventListener("close", () => {
			state.view.manageQuery = "";
			$("manager-search").value = "";
			resetClearConfirm();
			if (state.view.surface === "selected") setSurface(null);
			if (managerReturnFocus?.isConnected) managerReturnFocus.focus();
			managerReturnFocus = null;
		});
		document.querySelectorAll("[data-close-save]").forEach(button => button.addEventListener("click", closeSave));
		$("save-book-confirm").addEventListener("click", saveBook);
		$("save-book-name").addEventListener("input", updateSaveState);
		$("save-book-name").addEventListener("keydown", event => {
			if (event.key !== "Enter") return;
			event.preventDefault();
			saveBook();
		});
		$("save-book-dialog").addEventListener("close", () => {
			resetSaveConfirm();
			setSaveStatus("");
			const returnTo = saveReturnFocus;
			saveReturnFocus = null;
			deferFocus(returnTo);
		});
		document.querySelectorAll("[data-close-load]").forEach(button => button.addEventListener("click", closeLoad));
		$("load-book-dialog").addEventListener("close", () => {
			resetLoadConfirm();
			setLoadStatus("");
			const returnTo = loadReturnFocus;
			loadReturnFocus = null;
			deferFocus(returnTo);
		});
		document.querySelectorAll("[data-close-print]").forEach(button => button.addEventListener("click", closePrintSheet));
		$("print-sheet").addEventListener("close", () => {
			if (state.view.surface === "print") setSurface(null);
		});
		document.querySelectorAll("[data-close-browse]").forEach(button => button.addEventListener("click", closeBrowse));
		$("close-browse").addEventListener("click", closeBrowse);
		$("toggle-browse").addEventListener("click", openBrowse);
		$("detail-close").addEventListener("click", closeDetail);
		$("detail-prev").addEventListener("click", () => stepDetail(-1));
		$("detail-next").addEventListener("click", () => stepDetail(1));
		$("detail-flip").addEventListener("click", flipDetail);
		$("card-detail").addEventListener("close", () => {
			state.view.detailIndex = null;
			state.view.detailSide = state.view.inspectSide;
			detailZoom = 1;
			$("detail-stack").innerHTML = "";
			$("detail-stack").style.transform = "";
			detailPointers.clear();
			detailPinch = null;
			detailSwipe = null;
			if (state.view.surface === "detail") setSurface(null);
		});
		document.addEventListener("keydown", event => {
			if (state.view.surface === "browse" && event.key === "Escape") {
				closeBrowse();
				return;
			}
			const detail = $("card-detail");
			if (detail.open) {
				if (event.key === "ArrowRight") {
					event.preventDefault();
					stepDetail(1);
				} else if (event.key === "ArrowLeft") {
					event.preventDefault();
					stepDetail(-1);
				}
			}
		});
	}

	function bindMobile () {
		$("mobile-bar").addEventListener("click", event => {
			const button = event.target.closest("[data-surface]");
			if (!button) return;
			const surface = button.dataset.surface;
			if (surface === "browse") openBrowse();
			else if (surface === "selected") openManager();
			else if (surface === "print") openPrintSheet();
		});
		syncWorkspaceActions();
		if (typeof phoneQuery.addEventListener === "function") {
			phoneQuery.addEventListener("change", () => {
				syncWorkspaceActions();
				if (isPhone()) setPreviewMode("cards");
			});
		}
	}

	function bindResize () {
		if (typeof ResizeObserver !== "function") return;
		const observer = new ResizeObserver(() => scheduleGridMetrics());
		observer.observe($("preview-wrap"));
		observer.observe($("cards-gallery"));
	}

	function start (config) {
		icons.installSprite();
		icons.hydrateIcons();
		state.config = { ...config, page: { rows: 2, columns: 4, orientation: "landscape", ...config.page } };
		state.contentMode = state.config.defaultContentMode || "single";
		state.layout = "fronts";
		state.view.previewMode = isPhone() ? "cards" : "pages";
		state.view.density = "auto";
		resetInspectionSide();
		document.body.classList.toggle("page-portrait", state.config.page.orientation === "portrait");
		$("page-title").textContent = config.title;
		$("masthead-title").textContent = config.title;
		document.querySelectorAll(".brand-mark").forEach(mark => mark.setAttribute("aria-label", config.title));
		$("query").placeholder = `${config.entityLabel} name...`;
		$("sort").innerHTML = config.sortOptions.map(option => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join("");
		$("query").addEventListener("input", filter);
		$("sort").addEventListener("change", filter);
		$("select-visible").addEventListener("click", () => { state.filtered.forEach(entity => state.selected.set(idOf(entity), entity)); updateSelection(); });
		$("layout-group").addEventListener("click", event => {
			const button = event.target.closest("[data-layout]");
			if (!button) return;
			state.layout = button.dataset.layout;
			resetInspectionSide();
			updateLayoutButtons();
			closeDropdown({restoreFocus: true});
			if (state.selected.size) buildPreview();
		});
		$("inspection-side-group")?.addEventListener("click", event => {
			const button = event.target.closest("[data-inspect-side]");
			if (button) setInspectionSide(button.dataset.inspectSide);
		});
		$("content-group")?.addEventListener("click", event => {
			const button = event.target.closest("[data-content]");
			if (!button) return;
			state.contentMode = button.dataset.content;
			updateContentButtons();
			closeDropdown({restoreFocus: true});
			if (state.selected.size) buildPreview();
		});
		$("density-group").addEventListener("click", event => {
			const button = event.target.closest("[data-density]");
			if (!button) return;
			setDensity(button.dataset.density);
			closeDropdown({restoreFocus: true});
		});
		$("preview-mode-group").addEventListener("click", event => {
			const button = event.target.closest("[data-preview]");
			if (button) setPreviewMode(button.dataset.preview);
		});
		$("debug-print").addEventListener("click", () => { closeDropdown(); togglePrintDebug(); });
		$("btn-exit-debug").addEventListener("click", togglePrintDebug);
		$("btn-toggle-bg").addEventListener("click", toggleBgGraphics);
		$("print-cards").addEventListener("click", () => { closeDropdown(); window.print(); });
		$("save-book").addEventListener("click", event => openSave(event.currentTarget));
		$("load-book").addEventListener("click", event => openLoad(event.currentTarget));
		bindGallery();
		bindPagesZoom();
		bindDetailGestures();
		bindDialogs();
		bindMobile();
		bindResize();
		["content", "layout", "density"].forEach(bindDropdown);
		updateLayoutButtons();
		updateContentButtons();
		updateDensityButtons();
		updatePreviewModeVisibility();
		$("overlay-text").textContent = `Loading ${config.entityLabel.toLowerCase()}...`;
		load().then(() => { buildFilters(); filter(); $("overlay").hidden = true; }).catch(error => { $("overlay-text").textContent = `Unable to load ${config.entityLabel.toLowerCase()}: ${error.message}`; });
	}

	window.CardTool = { start };
})();
