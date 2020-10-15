/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BoilerplateActorSheet extends ActorSheet
{
	/** @override */
	static get defaultOptions()
	{
		var superOptions = super.defaultOptions;

		this.addHooks();

		return mergeObject(superOptions, {
			classes: ["primeCharacterSheet", "sheet", "actor"],
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
			if (changeData.data && changeData.data.actionPoints && changeData.data.actionPoints.lastTotal && !changeData.data.actionPoints.current && changeData.data.actionPoints.current !== 0)
			{
				return false;
			}
			if (changeData.actionPoints && Array.isArray(changeData.actionPoints) && !changeData.data)
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
		
		data.data.typeSorted = this.getTypeSortedPrimesAndRefinements(data);

		// Prepare items.
		if (this.actor.data.type == "character")
		{
			this._prepareCharacterItems(data);
		}

		return data;
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
		return ownerNames.join(", ");
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
		data.data.actionPoints.lastTotal = data.data.actionPoints.current;

		if (checked || (!checked && !inputParent.hasClass("currentActionPointTotal")))
		{
			data.data.actionPoints.current = parseInt(value);
		}
		else
		{
			data.data.actionPoints.current = parseInt(value) - 1;
		}

		if (data.data.actionPoints.current < 0)
		{
			data.data.actionPoints.current = 0;
		}

		var result = await this.actor.update(data.actor);
		console.log(result);
	}

	clearValueEditMode(event)
	{
		var valueWrappers = $(".valueEditable");
		valueWrappers.toggleClass("valueEditable");
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

		// Delete Inventory Item
		html.find(".item-delete").click((ev) =>
		{
			const li = $(ev.currentTarget).parents(".item");
			this.actor.deleteOwnedItem(li.data("itemId"));
			li.slideUp(200, () => this.render(false));
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
		html.find(".fillAnimation").removeClass("fillAnimation");
		html.find(".emptyAnimation").removeClass("emptyAnimation");

		const data = super.getData();
		data.data.actionPoints.lastTotal = data.data.actionPoints.current;
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


Handlebars.registerHelper('actionSelected', function (pointIndex, currentPoints)
{
	if (pointIndex <= currentPoints)
	{
		return "checked";
	}
	return "";
});

Handlebars.registerHelper('actionStateClasses', function (pointIndex, actionPointData)
{
	const current = actionPointData.current;
	const lastTotal = actionPointData.lastTotal;
	var classes = []

	if (pointIndex <= current)
	{
		classes.push("activeActionPoint");
	}
	if (pointIndex == current)
	{
		classes.push("currentActionPointTotal");
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