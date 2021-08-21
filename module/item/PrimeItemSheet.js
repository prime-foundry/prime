import { PrimeTables } from "../prime_tables.js";
import {DynApplicationMixin} from "../util/DynFoundryMixins.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PrimeItemSheet extends DynApplicationMixin(ItemSheet)
{
	checkboxGroupStates = {}

	/** @override */
	static get defaultOptions()
	{
		if (game.user.isGM)
		{
			var isGMClass = "userIsGM";
		}
		else
		{
			var isGMClass = "userIsNotGm";
		}
		var primeItemOptions =
		{
			classes: ["primeSheet", "primeItemSheet", "sheet", isGMClass],
			width: 420,
			height: 550,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
		}

		return mergeObject(super.defaultOptions, primeItemOptions);
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


	/** @override */
	getData()
	{
		let data = super.getData();

		data.checkboxGroupStates = this.checkboxGroupStates;

		data.isOwned = this.item.isOwned;
		data.owningCharacterName = null;

		if (this.actor)
		{
			data.owningCharacterName = this.actor.name;
		}		

		return data;
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

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html)
	{
		super.activateListeners(html);

		const groupTitles = html.find(".checkboxGroupTitle");
		groupTitles.click(this.toggleCheckboxGroup.bind(this));

		
		// html.find(".checkboxGroup").change(this.processCheckboxGroup.bind(this));

		// html.find(".effectFormElement").change(this.perkEffectFormElementChanged.bind(this));

		// if (!this.item.isOwned)
		// {
		// 	html.find(".removeEffectIcon").click(this.removeEffect.bind(this));
		// 	html.find(".addEffectIcon").click(this.addBlankEffect.bind(this));
		// }

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		// Roll handlers, click handlers, etc. would go here.
	}


	toggleCheckboxGroup(event)
	{
		const checkboxGroupTitle = $(event.delegateTarget);
		const checkboxGroupID = checkboxGroupTitle.data("checkbox-group");
		const outerWrapper = checkboxGroupTitle.parent();
		const targetGroupWrapper = outerWrapper.find(".checkboxGroupWrapper[data-checkbox-group='" + checkboxGroupID + "']");

		if (!this.checkboxGroupStates[checkboxGroupID])
		{
			this.checkboxGroupStates[checkboxGroupID] = true;
			
			checkboxGroupTitle.addClass("expanded");
			checkboxGroupTitle.removeClass("collapsed");
			targetGroupWrapper.addClass("expanded");
			targetGroupWrapper.removeClass("collapsed");
		}
		else
		{
			this.checkboxGroupStates[checkboxGroupID] = false;

			checkboxGroupTitle.removeClass("expanded");
			checkboxGroupTitle.addClass("collapsed");
			targetGroupWrapper.removeClass("expanded");
			targetGroupWrapper.addClass("collapsed");
		}
	}

	async removeEffect(event)
	{
		event.preventDefault();
		const removeIcon = $(event.delegateTarget);
		const effectID = removeIcon.data("effect-id");

		var effectToDelete = this.item.effects.get(effectID);

		effectToDelete.delete();
	}
	
	async addBlankEffect(event)
	{
		event.preventDefault();
		const removeIcon = $(event.delegateTarget);
		const effectType = removeIcon.data("effect-type");

		var effectData = this.getBlankEffectByType(effectType);

		const result = this.item.createEmbeddedDocuments("ActiveEffect", [effectData]);

		//var newActiveEffect = await ActiveEffect.create(effectData, this.item);
		//var endResult = newActiveEffect.create();
		//console.log("Created? Result: ", endResult);
	}

	getBlankEffectByType(effectType)
	{
		var baseEffectData =
		{
			icon: "icons/svg/aura.svg",
			origin: this.item.uuid,
			flags: 
			{
				"effectType": effectType,
				"value": 0,
			},
			changes: [],
		};

		switch (effectType)
		{
			case "bonus":
			case "effect":
			case "untendedEffect":
			case "tendedEffect":
			case "permanentEffect":
				baseEffectData.label = "Effect";
				baseEffectData.flags.effectSubType = "situationalPrime";
				baseEffectData.flags.path = "end";
			break;
			case "prerequisite":
				baseEffectData.label = "Perk prerequisite";
				baseEffectData.flags.effectSubType = "minimumPrime";
				baseEffectData.flags.path = "end";
			break;
			case "actionEffect":
				baseEffectData.label = "Action effect";
				baseEffectData.flags.effectSubType = "move";
				baseEffectData.flags.path = "null";
			break;
			case "checkbox-keywords":
				baseEffectData.label = "Checkbox group - Keywords";
			break;
			case "checkbox-untrained":
				baseEffectData.label = "Checkbox group - Untrained penalities";
			break;
			case "checkbox-actions":
				baseEffectData.label = "Checkbox group - Custom weapon actions";
			break;
			case "checkbox-wound-conditions":
				baseEffectData.label = "Checkbox group - Wound conditions";
			break;
			default:
				console.error("ERROR: Unknown effect type of '" + effectType + "' found in getBlankEffectByType().");
			break;
		}

		return baseEffectData;
	}
}