/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PrimeItemSheet extends ItemSheet
{

	/** @override */
	static get defaultOptions()
	{
		return mergeObject(super.defaultOptions, {
			classes: ["primeSheet", "primeItemSheet", "sheet", "genericItem"],
			width: 420,
			height: 550,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
		});
	}

	/** @override */
	get template()
	{
		const path = "systems/prime/templates/item";
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/item-${this.item.data.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData()
	{
		let data = super.getData();
		data.tables = this.getItemTables();
		this.addItemTypeData(data);
		return data;
	}

	getItemTables()
	{
		var _itemTables = $.extend({}, game.system.template.Tables.items);
		this.addTranslations(_itemTables);
		return _itemTables;
	}

	addItemTypeData(data)
	{
		switch(data.item.type)
		{
			case "item":
			break;
			case "melee-weapon":
				data.checkboxGroups = this.compileCheckboxGroups(data);
			break;
			case "ranged-weapon":
				data.checkboxGroups = this.compileCheckboxGroups(data);
			break;
			case "armour":
			break;
			case "perk":
			break;
			default:
				console.warn("Unknown item type of '' found in addItemTypeData().");
			break;
		}

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

	compileCheckboxGroups(data)
	{
		let woundList = this.cloneAndAddSelectedState(data.tables.weapons.woundConditions, data.data.woundConditions);
		let keywordsList = this.cloneAndAddSelectedState(data.tables.weapons.keywords, data.data.keywords);
		let actionsList = this.cloneAndAddSelectedState(data.tables.weapons.weaponActions, data.data.customActions);

		return {wounds: woundList, keywords: keywordsList, actions: actionsList};	
	}

	cloneAndAddSelectedState(whatRawOptionsArray, whatSelectionData)
	{
		let checkboxGroupObject = $.extend([], whatRawOptionsArray);

		var count = 0;

		while (count < checkboxGroupObject.length)
		{
			let currOption = checkboxGroupObject[count];
			currOption.checked = whatSelectionData[count];
			count++;
		}

		return checkboxGroupObject;
	}

	async _updateObject(event, data)
	{
		const baseData = super.getData();
		if (!baseData.data.creator)
		{
			this.addMetaData(data);
		}
		else
		{
			this.updateMetaData(data);
		}

		var result = await super._updateObject(event, data);
		//return result;
	}

	addMetaData(data)
	{
		data["data.creator"] = game.users.get(game.userId).name;
		data["data.creatorID"] = game.userId;

		data["data.updater"] = game.users.get(game.userId).name;
		data["data.updaterID"] = game.userId;

		var dateString = this.getDateString();

		data["data.created"] = dateString;
		data["data.updated"] = dateString;

		//game.users.get(game.userId);
	}

	updateMetaData(data)
	{
		data["data.updater"] = game.users.get(game.userId).name;
		data["data.updaterID"] = game.userId;

		var dateString = this.getDateString();
		data["data.updated"] = dateString;
	}


	/* -------------------------------------------- */

	/** @override */
	setPosition(options = {})
	{
		const position = super.setPosition(options);
		const sheetBody = this.element.find(".sheet-body");
		const bodyHeight = position.height - 192;
		sheetBody.css("height", bodyHeight);
		return position;
	}

	getDateString()
	{
		//const timezone = new Date().getTimezoneOffset();
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
		const dateString = new Date().toLocaleDateString(
			'en-gb',
			{
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				timeZone: timezone
			}
		);
		return dateString
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html)
	{
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Roll handlers, click handlers, etc. would go here.
	}
}