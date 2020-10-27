/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PrimePCActorSheet extends ActorSheet
{
	resizeOccuring = false;
	actorSheetMeasureTimer = false;
	updateWidthClassInterval = 50;

	/** @override */
	static get defaultOptions()
	{
		var superOptions = super.defaultOptions;

		this.addHooks();

		return mergeObject(superOptions, {
			classes: ["primeSheet", "primeCharacterSheet", "sheet", "actor"],
			template: "systems/prime/templates/actor/actor-sheet.html",
			width: 750,
			height: 750,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "description"
				}
			],
		});
	}
	
	static addHooks()
	{
		Hooks.on("preUpdateActor", function(actorData, changeData, options, maybeUpdateID)
		{
			if (changeData.data && changeData.data.actionPoints && changeData.data.actionPoints.lastTotal && !changeData.data.actionPoints.value && changeData.data.actionPoints.value !== 0)
			{
				return false;
			}
			if (changeData.actionPoints && Array.isArray(changeData.actionPoints) && !changeData.data && !changeData.name && !changeData.img && (changeData.token && !changeData.token.img))
			{
				return false;
			}
			return true;			
		});
	}


	/* -------------------------------------------- */

	/** @override */
	getData()
	{
		const data = super.getData();
		data.dtypes = ["String", "Number", "Boolean"];
		for (let [key, entry] of Object.entries(data.data.primes))
		{
			entry.title = game.i18n.localize(entry.title);
		}
		for (let [key, entry] of Object.entries(data.data.refinements))
		{
			entry.title = game.i18n.localize(entry.title);
		}

		data.currentOwners = this.getCurrentOwners(data.actor.permission);

		data.combinedResilience = data.data.health.resilience.value + data.data.armour.resilience.value;
		
		data.data.typeSorted = this.getTypeSortedPrimesAndRefinements(data);
		
		data.tables = this.getItemTables();

		this.processItems(data);

		// Prepare items.
		if (this.actor.data.type == "character")
		{
			this._prepareCharacterItems(data);
		}

		return data;
	}

	getCurrentOwners(whatPermissions)
	{
		let ownerNames = [];
		let currUser;
		for (var key in whatPermissions)
		{
			currUser = game.users.get(key)
			if (key != "default" && whatPermissions[key] == 3 && !currUser.isGM)
			{
				ownerNames.push(currUser.name);
			}
		}

		if (ownerNames.length == 0)
		{
			ownerNames.push("Not assigned");
		}

		return ownerNames.join(", ");
	}

	getTypeSortedPrimesAndRefinements(sourceData)
	{
		var sortedData = {};
		var currEntry = null;
		for (var key in sourceData.data.primes)
		{
			currEntry = sourceData.data.primes[key];
			if (!sortedData[currEntry.type])
			{
				let localisedTitle = game.i18n.localize("PRIME.refinment_type_" + currEntry.type);
				sortedData[currEntry.type] =
				{
					primes: {},
					refinements: {},
					title: localisedTitle
				}
			}
			sortedData[currEntry.type].primes[key] = currEntry;
		}
		for (var key in sourceData.data.refinements)
		{
			currEntry = sourceData.data.refinements[key];
			sortedData[currEntry.type].refinements[key] = currEntry;
		}
		return sortedData;
	}

	getItemTables()
	{
		var _itemTables = $.extend({}, game.system.template.Tables.items);
		this.addTranslations(_itemTables);
		return _itemTables;
	}

	addTranslations(whatData)
	{
		for (var key in whatData)
		{
			if (key == "title" || key == "description")
			{
				var translation = game.i18n.localize(whatData[key])
				whatData[key] = translation;
			}
			if (typeof whatData[key] === 'object' && whatData[key] !== null)
			{
				this.addTranslations(whatData[key]);
			}
		}
	}

	processItems(data)
	{
		data.filteredItems = this.filterItemsByType(data);
	}

	filterItemsByType(data)
	{
		const itemData = data.items;
		var itemTypes = {}
		var count = 0;
		while (count < itemData.length)
		{
			let currItem = itemData[count];
			if (!itemTypes[currItem.type])
			{
				itemTypes[currItem.type] = [];
			}

			currItem = this.processItem(currItem, data.tables);

			itemTypes[currItem.type].push(currItem);
			count++;
		}
		return itemTypes;
	}

	processItem(itemData, tables)
	{
		switch (itemData.type)
		{
			case "item":
			break;
			case "melee-weapon":
				itemData = this.processWeapon(itemData, "melee", tables);
			break;
			case "ranged-weapon":
				itemData = this.processWeapon(itemData, "ranged", tables);
			break;
			case "armour":
			break;
			case "perk":
			break;
			default:
				console.warn("Unknown item type of '" + itemData.type + "' found in processItem().");
			break;
		}
		return itemData;
	}

	processWeapon(weaponData, catergory, tables)
	{
		weaponData.data.weaponSize = this.getTitleFromTableByKey(weaponData.data.weaponSize, tables.weapons.sizes);
		weaponData.data.weaponType = this.getTitleFromTableByKey(weaponData.data.weaponType, tables.weapons[catergory + "Types"]);

		weaponData.data.rarity = this.getTitleFromTableByKey(weaponData.data.rarity, tables.rarity);

		weaponData.data.woundConditions = this.getTitlesFromTableByCheckboxGroupArray(weaponData.data.woundConditions, tables.weapons.woundConditions);
		weaponData.data.keywords = this.getTitlesFromTableByCheckboxGroupArray(weaponData.data.keywords, tables.weapons.keywords);
		weaponData.data.customActions = this.getTitlesFromTableByCheckboxGroupArray(weaponData.data.customActions, tables.weapons[catergory + "WeaponActions"]);

		if (catergory == "ranged")
		{
			weaponData.data.ammo.type = this.getTitleFromTableByKey(weaponData.data.ammo.type, tables.weapons.ammoTypes);
		}

		return weaponData
	}

	getTitleFromTableByKey(key, table)
	{
		var count = 0;
		while (count < table.length)
		{
			let entry = table[count];
			if (entry.key == key)
			{
				return entry.title;
			}
			count++;
		}
		console.error("ERROR: Unable to find an entry with the key of '" + key + "' in: ", table);
		return "";
	}

	getTitlesFromTableByCheckboxGroupArray(checkboxGroupArray, table)
	{
		var titlesArray = [];

		if (checkboxGroupArray.length != table.length)
		{
			console.warn("WARNING: Mismatched lengths between checkbox group array and data table.", checkboxGroupArray, table);
		}

		var count = 0;
		while (count < checkboxGroupArray.length)
		{
			if (checkboxGroupArray[count])
			{
				let entry = table[count];
				titlesArray.push("<span title='" + entry.description + "' class='hasTooltip'>" + entry.title + "</span>");
			}
			count++;
		}

		if (titlesArray.length == 0)
		{
			titlesArray.push("None");
		}
		return titlesArray.join(", ");
	}

	toggleSheetEditMode()
	{
		this.element.toggleClass("sheetEditable");
	}

	toggleValueEditMode(event)
	{
		var valueWrapper = $(event.delegateTarget);
		if (!valueWrapper.hasClass("valueEditable"))
		{
			var input = valueWrapper.find("input");
			input.focus();
			input.select();
			input.data("lastValue", input.val());
		}
		valueWrapper.toggleClass("valueEditable");
		//this.element.toggleClass("sheetEditable");
	}

	checkPreventClose(event)
	{
		var valueWrapper = $(event.delegateTarget);
		if (valueWrapper.hasClass("valueEditable"))
		{
			event.stopPropagation();
		}
	}

	validateNumber(event)
	{
		var input = $(event.delegateTarget);
		var value = input.val();
		var parsed = parseInt(value);
		if (!isNaN(parsed))
		{
			var min = parseInt(input.data("min"));
			var max = parseInt(input.data("max"));
			if ((min || min === 0) && parsed < min)
			{
				parsed = min;
			}
			if ((max || max === 0) && parsed > max)
			{
				parsed = max;
			}
			if (parsed != value)
			{
				console.log("Trimmed noise, initial: '" + value + "', parsed:'" + parsed + "'");
				input.val(parsed);
			}
		}
		else if (input.data("lastValue"))
		{
			input.val(input.data("lastValue"));
		}
		else
		{
			input.val(input.data("min"));
		}
	}

	async updateActionPoints(event)
	{
		const input = $(event.delegateTarget);
		const value = input.val();
		const data = super.getData();
		const checked = input.prop("checked");
		const inputParent = input.parent();
		data.data.actionPoints.lastTotal = data.data.actionPoints.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			data.data.actionPoints.value = parseInt(value);
		}
		else
		{
			data.data.actionPoints.value = parseInt(value) - 1;
		}

		if (data.data.actionPoints.value < 0)
		{
			data.data.actionPoints.value = 0;
		}

		var result = await this.actor.update(data.actor);
		//console.log(result);
	}

	async updateInjuryTotal(event)
	{
		const input = $(event.delegateTarget);
		const value = input.val();
		const data = super.getData();
		const checked = input.prop("checked");
		const inputParent = input.parent();
		data.data.health.wounds.lastTotal = data.data.health.wounds.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			data.data.health.wounds.value = parseInt(value);
		}
		else
		{
			data.data.health.wounds.value = parseInt(value) - 1;
		}

		if (data.data.health.wounds.value < 0)
		{
			data.data.health.wounds.value = 0;
		}

		var result = await this.actor.update(data.actor);
	}

	async updateInjuryDetail(event)
	{
		const select = $(event.delegateTarget);
		const value = select.val();
		const injuryIndex = select.data("injury-index");
				
		const data = super.getData();
		data.data.wounds["wound" + (injuryIndex - 1)] = value;

		var result = await this.actor.update(data.actor);
	}

	// checkEnableInjury(event)
	// {
	// 	const injuryRow = $(event.delegateTarget);
	// 	const siblingCheckbox = injuryRow.find(".injuryCheckbox");
	// 	const checkBoxState = siblingCheckbox.val();
	// 	if (siblingCheckbox.prop( "checked" ) == false)
	// 	{
	// 		siblingCheckbox.prop( "checked", true );
	// 	}
	// }

	async healInjury(event)
	{
		const anchor = $(event.delegateTarget);
		const injuryIndex = anchor.data("injury-index");
				
		const data = super.getData();

		var count = injuryIndex - 1;
		while (count <= data.data.health.wounds.max)
		{
			var _nextInjury = data.data.wounds["wound" + (count + 1)]
			if (_nextInjury)
			{
				data.data.wounds["wound" + count] = _nextInjury;
			}
			else
			{
				data.data.wounds["wound" + count] = 0;
			}
			count++;
		}

		if (injuryIndex <= data.data.health.wounds.value)
		{
			data.data.health.wounds.lastTotal = data.data.health.wounds.value;
			data.data.health.wounds.value--;
		}

		var result = await this.actor.update(data.actor);
	}

	resizeUpdateStart(event)
	{
		this.resizeOccuring = true;
		this.createWidthUpdateTimer();
	}

	createWidthUpdateTimer()
	{
		if (this.resizeOccuring)
		{
			this.actorSheetMeasureTimer = window.setTimeout(this.updateWidthClasses.bind(this), this.updateWidthClassInterval);
		}
		else
		{
			this.clearMeasureTimer();
		}
	}

	updateWidthClasses()
	{
		//console.log(this.position.width);
		if (this.position.width <= 665)
		{
			this.element.addClass("narrowWidth");
			this.element.removeClass("mediumWidth");
			this.element.removeClass("wideWidth");
		}
		else if (this.position.width > 665 && this.position.width <= 995)
		{
			this.element.removeClass("narrowWidth");
			this.element.addClass("mediumWidth");
			this.element.removeClass("wideWidth");
		}
		else
		{
			this.element.removeClass("narrowWidth");
			this.element.removeClass("mediumWidth");
			this.element.addClass("wideWidth");
		}
		this.createWidthUpdateTimer();
	}

	resizeUpdateEnd(event)
	{
		this.resizeOccuring = false;
		//console.log("Ending...")
		this.updateWidthClasses()
	}

	clearMeasureTimer()
	{
		if (this.actorSheetMeasureTimer)
		{
			window.clearInterval(this.actorSheetMeasureTimer);
			this.actorSheetMeasureTimer = false;
		}
	}

	clearValueEditMode(event)
	{
		var valueWrappers = $(".valueEditable");
		valueWrappers.toggleClass("valueEditable");
	}

	
	deleteItem(event)
	{
		const deleteLink = $(event.delegateTarget);
		const itemID = deleteLink.data("item-id");
		this.actor.deleteOwnedItem(itemID);
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareCharacterItems(sheetData)
	{
		const actorData = sheetData.actor;

		// Initialize containers.
		const gear = [];
		const features = [];

		const spells = {
			0: [],
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
			6: [],
			7: [],
			8: [],
			9: [],
		};

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of sheetData.items)
		{
			let item = i.data;
			i.img = i.img || DEFAULT_TOKEN;
			// Append to gear.
			if (i.type === "item")
			{
				gear.push(i);
			}
			// Append to features.
			else if (i.type === "feature")
			{
				features.push(i);
			}
			// Append to spells.
			else if (i.type === "spell")
			{
				if (i.data.spellLevel != undefined)
				{
					spells[i.data.spellLevel].push(i);
				}
			}
		}

		// Assign and return
		actorData.gear = gear;
		actorData.features = features;
		actorData.spells = spells;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html)
	{
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find(".toggleCharacterEditing").click(this.toggleSheetEditMode.bind(this));
		html.find(".toggleCharacterLocked").click(this.toggleSheetEditMode.bind(this));

		html.find(".valueWrapper").dblclick(this.toggleValueEditMode.bind(this));
		html.find(".valueWrapper").click(this.checkPreventClose.bind(this));
		
		html.find("input[data-dtype='Number']").change(this.validateNumber.bind(this));

		html.click(this.clearValueEditMode.bind(this));

		html.find(".actionPointCheckbox").change(this.updateActionPoints.bind(this));
		
		//html.find(".injuryRow").click(this.checkEnableInjury.bind(this));
		
		html.find(".injuryCheckbox").change(this.updateInjuryTotal.bind(this));
		html.find(".injurySelect").change(this.updateInjuryDetail.bind(this));
		html.find(".healInjury").click(this.healInjury.bind(this));

		var resizeHandle = html.parent().parent().find(".window-resizable-handle");
		
		resizeHandle.mousedown(this.resizeUpdateStart.bind(this));
		$(document).mouseup(this.resizeUpdateEnd.bind(this));
		resizeHandle.click(this.resizeUpdateEnd.bind(this));

		html.find(".deleteItemIcon").click(this.deleteItem.bind(this));

		// Previous event listeners below here

		// Add Inventory Item
		html.find(".item-create").click(this._onItemCreate.bind(this));

		// Update Inventory Item
		html.find(".item-edit").click((ev) =>
		{
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.getOwnedItem(li.data("itemId"));
			item.sheet.render(true);
		});

		// Drag events for macros.
		if (this.actor.owner)
		{
			let handler = (ev) => this._onDragItemStart(ev);
			html.find("li.item").each((i, li) =>
			{
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}

		this.postActivateListeners(html);
	}

	async postActivateListeners(html)
	{
		const data = super.getData();

		html.find(".injurySelect").each(function(index, element)
		{
			$(element).val(data.data.wounds["wound" + index]);
		});

		html.find(".fillAnimation").removeClass("fillAnimation");
		html.find(".emptyAnimation").removeClass("emptyAnimation");

		data.data.actionPoints.lastTotal = data.data.actionPoints.value;
		var result = await this.actor.update(data.actor, {render: false});
	}


	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemCreate(event)
	{
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			data: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.data["type"];

		// Finally, create the item!
		return this.actor.createOwnedItem(itemData);
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event)
	{
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.roll)
		{
			let roll = new Roll(dataset.roll, this.actor.data.data);
			let label = dataset.label ? `Rolling ${dataset.label}` : "";
			roll.roll().toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label,
			});
		}
	}
}

Handlebars.registerHelper('for', function(from, to, incr, block) {
    var accum = '';
    for(var i = from; i <= to; i += incr)
        accum += block.fn(i);
    return accum;
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});


Handlebars.registerHelper('itemSelected', function (pointIndex, currentPoints)
{
	if (pointIndex <= currentPoints)
	{
		return "checked";
	}
	return "";
});

Handlebars.registerHelper('itemEnabled', function (pointIndex, currentPoints)
{
	if (pointIndex <= currentPoints)
	{
		return "";
	}
	return "disabled";
});

Handlebars.registerHelper('addStateClasses', function (pointIndex, basePointData)
{
	const current = basePointData.value;
	const lastTotal = basePointData.lastTotal;
	var classes = []

	if (pointIndex <= current)
	{
		classes.push("activePoint");
	}
	if (pointIndex == current)
	{
		classes.push("currentPointTotal");
	}

	if (lastTotal > current)
	{
		if (pointIndex > current && pointIndex <= lastTotal)
		{
			classes.push("emptyAnimation");
		}
	}
	else if (lastTotal < current)
	{
		if (pointIndex > lastTotal && pointIndex <= current)
		{
			classes.push("fillAnimation");
		}
	}
	if (classes.length > 0)
	{
		return " " + classes.join(" ");
	}
	return "";
});