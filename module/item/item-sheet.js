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
			width: 350,
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
		const data = super.getData();
		return data;
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