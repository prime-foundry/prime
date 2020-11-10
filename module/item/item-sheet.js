import { PrimeTables } from "../prime_tables.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PrimeItemSheet extends ItemSheet
{
	checkboxGroupStates = {}

	/** @override */
	static get defaultOptions()
	{
		return mergeObject(super.defaultOptions, {
			classes: ["primeSheet", "primeItemSheet", "sheet"],
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


	/** @override */
	getData()
	{
		let data = super.getData();
		data.itemTables = PrimeTables.cloneAndTranslateTables("items");
		data.coreTables = PrimeTables.cloneAndTranslateTables("core");
		data.perkTables = PrimeTables.cloneAndTranslateTables("perks");
		data.actionTables = PrimeTables.cloneAndTranslateTables("actions");
		this.addItemTypeData(data);
		data.checkboxGroupStates = this.checkboxGroupStates;
		//data.allowAdditionalBonuses = this.findDeletedBonus();
		return data;
	}

	addItemTypeData(data)
	{
		switch(data.item.type)
		{
			case "item":
			break;
			case "melee-weapon":
				data.checkboxGroups = this.compileWeaponCheckboxGroups(data, "melee");
			break;
			case "ranged-weapon":
				data.checkboxGroups = this.compileWeaponCheckboxGroups(data, "ranged");
				this.addRangeCatergoryTitles(data)
			break;
			case "armour":
				data.checkboxGroups = this.compileArmourCheckboxGroups(data);
			break;
			case "armour":
			break;
			case "perk":
				data.bonuses = this.getEffectsRenderableData("bonus");
				data.prerequisites = this.getEffectsRenderableData("prerequisite");
			break;
			case "action":
				data.effects = this.getEffectsRenderableData("actionEffect");
			break;
			default:
				console.warn("Unknown item type of '" + data.item.type + "' found in addItemTypeData().");
			break;
		}
	}

	compileWeaponCheckboxGroups(data, subTypeKey)
	{
		let woundList = this.cloneAndAddSelectedState(data.itemTables.weapons.woundConditions, data.data.woundConditions);
		let keywordsList = this.cloneAndAddSelectedState(data.itemTables.weapons.keywords, data.data.keywords);
		let actionsList = this.cloneAndAddSelectedState(data.itemTables.weapons[subTypeKey + 'WeaponActions'], data.data.customActions);

		return {wounds: woundList, keywords: keywordsList, actions: actionsList};	
	}

	compileArmourCheckboxGroups(data)
	{
		let keywordsList = this.cloneAndAddSelectedState(data.itemTables.armour.keywords, data.data.keywords);
		let untrainedPenaltyList = this.cloneAndAddSelectedState(data.itemTables.armour.untrainedPenalities, data.data.untrainedPenalty);

		return {keywords: keywordsList, untrainedPenalty: untrainedPenaltyList};	
	}

	getEffectsRenderableData(targetEffectType)
	{
		var effectData = [];
		var matchingEffectsCount = 0;
		this.item.effects.forEach((effect, key, effects) =>
		{
			if (effect.data.flags.effectType == targetEffectType)
			{
				matchingEffectsCount++
				var effectDataForRender = this.getRenderableDataFromEffect(effect, targetEffectType, matchingEffectsCount);
				effectData.push(effectDataForRender);
			}
		})

		return effectData;
	}

	getRenderableDataFromEffect(whatEffect, targetEffectType, matchingEffectsCount)
	{
		switch (targetEffectType)
		{
			case "bonus":
				var renderableData = this.getRenderableBonusDataFromEffect(whatEffect, matchingEffectsCount)
			break;
			case "prerequisite":
				var renderableData = this.getRenderablePrerequiristeDataFromEffect(whatEffect, matchingEffectsCount)
			break;
			case "actionEffect":
				var renderableData = this.getRenderableActionDataFromEffect(whatEffect, matchingEffectsCount)
			break;
			default:
				console.warn("Unknown item type of '" + targetEffectType + "' found in getRenderableDataFromEffect(). Effect: ". whatEffect);
			break;
		}
		return renderableData;
	}

	getRenderableBonusDataFromEffect(whatEffect, matchingEffectsCount)
	{
		var dynamicDataForBonusTarget = this.getDynamicDataForBonusTarget(whatEffect.data.flags.effectSubType);

		var renderableEffectData =
		{
			effectID: whatEffect.id,
			effectSubType: whatEffect.data.flags.effectSubType,
			dynamicDataForEffectTarget: dynamicDataForBonusTarget,
			path: whatEffect.data.flags.path,
			value: whatEffect.data.flags.value,
			actualCount: matchingEffectsCount
		}

		return renderableEffectData;
	}


	getDynamicDataForBonusTarget(perkBonusType)
	{
		var dynamicDataForBonusTarget = [];
		switch (perkBonusType)
		{
			case "situationalPrime":
				dynamicDataForBonusTarget = PrimeTables.getPrimeKeysAndTitles();
			break;
			case "situationalRefinement":
				dynamicDataForBonusTarget = PrimeTables.getRefinementKeysAndTitles();
			break;
			case "extraAction":
				dynamicDataForBonusTarget = PrimeTables.getActionKeysAndTitles();
			break;
			case "actionPointBonus":
				dynamicDataForBonusTarget = PrimeTables.getActionKeysAndTitles();
			break;
			case "actorStatBonus":
				dynamicDataForBonusTarget = PrimeTables.cloneAndTranslateTables("actor.actorStatLookup");
			break;
			case "externalStatBonus":
				dynamicDataForBonusTarget = PrimeTables.cloneAndTranslateTables("perks.externalStatLookup");
			break;
			case "misc":
				dynamicDataForBonusTarget = PrimeTables.cloneAndTranslateTables("perks.miscBonusLookup");
			break;
			default:
				console.error("Unknown perk type of '" + perkBonusType + "' found in getDynamicDataPathForBonus().");
			break;
		}
	
		return dynamicDataForBonusTarget;
	}


	getRenderablePrerequiristeDataFromEffect(whatEffect, matchingEffectsCount)
	{
		var dynamicDataForPrerequisiteTarget = this.getDynamicDataForPrerequisiteTarget(whatEffect.data.flags.effectSubType);

		var renderableEffectData =
		{
			effectID: whatEffect.id,
			effectSubType: whatEffect.data.flags.effectSubType,
			dynamicDataForEffectTarget: dynamicDataForPrerequisiteTarget,
			path: whatEffect.data.flags.path,
			value: whatEffect.data.flags.value,
			actualCount: matchingEffectsCount
		}

		return renderableEffectData;
	}

	getDynamicDataForPrerequisiteTarget(perkPrereqiusiteType)
	{
		var dynamicDataForPrerequisiteTarget = [];
		switch (perkPrereqiusiteType)
		{
			case "minimumPrime":
				dynamicDataForPrerequisiteTarget = PrimeTables.getPrimeKeysAndTitles();
			break;
			case "minimumRefinement":
				dynamicDataForPrerequisiteTarget = PrimeTables.getRefinementKeysAndTitles();
			break;
			case "minimumStat":
				dynamicDataForPrerequisiteTarget = PrimeTables.cloneAndTranslateTables("actor.actorStatLookup");
			break;
			case "maximumPrime":
				dynamicDataForPrerequisiteTarget = PrimeTables.getPrimeKeysAndTitles();
			break;
			case "maximumRefinement":
				dynamicDataForPrerequisiteTarget = PrimeTables.getRefinementKeysAndTitles();
			break;
			case "maximumStat":
				dynamicDataForPrerequisiteTarget = PrimeTables.cloneAndTranslateTables("actor.actorStatLookup");
			break;
			case "otherPerk":
				dynamicDataForPrerequisiteTarget = PrimeTables.getItemKeysAndTitlesByType("perk");
			break;			
			default:
				console.error("Unknown perk type of '" + perkPrereqiusiteType + "' found in getDynamicDataForPrerequisiteTarget().");
			break;
		}
	
		return dynamicDataForPrerequisiteTarget;
	}

	getRenderableActionDataFromEffect(whatEffect, matchingEffectsCount)
	{
		var dynamicDataForActionTarget = this.getDynamicDataForActionTarget(whatEffect.data.flags.effectSubType);

		var renderableEffectData =
		{
			effectID: whatEffect.id,
			effectSubType: whatEffect.data.flags.effectSubType,
			dynamicDataForEffectTarget: dynamicDataForActionTarget,
			path: whatEffect.data.flags.path,
			value: whatEffect.data.flags.value,
			actualCount: matchingEffectsCount
		}

		return renderableEffectData;
	}

	getDynamicDataForActionTarget(actionSubType)
	{
		var dynamicDataForActionTarget = [];
		switch (actionSubType)
		{
			case "move":
			case "meleeAttack":
			case "rangedAttack":
			case "meleeBlock":
			case "rangedBlock":
			case "magic":
			case "misc":
				dynamicDataForActionTarget = PrimeTables.cloneAndTranslateTables("actions.miscBonusLookup");
			break;
			case "gainPoints":
				dynamicDataForActionTarget = PrimeTables.cloneAndTranslateTables("actor.actorStatLookup");
			break;
			default:
				console.error("Unknown perk type of '" + actionSubType + "' found in getDynamicDataForActionTarget().");
			break;
		}
	
		return dynamicDataForActionTarget;
	}

	cloneAndAddSelectedState(whatRawOptionsArray, whatSelectionData)
	{
		let checkboxGroupObject =
		{
			optionsData: $.extend(true, [], whatRawOptionsArray),
			selectedItems: []
		}

		var count = 0;

		while (count < checkboxGroupObject.optionsData.length)
		{
			let currOption = checkboxGroupObject.optionsData[count];
			currOption.checked = whatSelectionData[count];
			if (currOption.checked)
			{
				let selectedItemData = {title: currOption.title};
				if (currOption.description)
				{
					selectedItemData.description = currOption.description;
				}
				checkboxGroupObject.selectedItems.push(selectedItemData);
			}
			count++;
		}

		if (checkboxGroupObject.selectedItems.length == 0)
		{
			checkboxGroupObject.selectedItems.push({title: "none"});
		}

		return checkboxGroupObject;
	}

	addRangeCatergoryTitles(data)
	{
		for (let key in data.data.ranges)
		{
			data.data.ranges[key].title = data.itemTables.weapons.rangeCatergories[key];
		}
	}

	async _updateObject(event, data)
	{
		this.checkMetaData(data);
		var result = await super._updateObject(event, data);
		//return result;
	}

	checkMetaData(data)
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

		const groupTitles = html.find(".checkboxGroupTitle");
		groupTitles.click(this.toggleCheckboxGroup.bind(this));

		html.find(".effectFormElement").change(this.perkEffectFormElementChanged.bind(this));

		html.find(".removeEffectIcon").click(this.removeEffect.bind(this));
		html.find(".addEffectIcon").click(this.addBlankEffect.bind(this));

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

	
	async perkEffectFormElementChanged(event)
	{
		event.preventDefault();
		event.stopPropagation();

		const formElement = $(event.delegateTarget);
		const effectID = formElement.data("effect-id");
		const flagKey = formElement.data("effect-flag-key");

		const updateData = {flags:{}};
		updateData.flags[flagKey] = formElement.val();

		// If we've changed effect subtype, reset the data path as it will be meaningless.
		if (flagKey == "effectSubType")
		{
			updateData.flags.path = "";
		}

		var effectToUpdate = await this.item.effects.get(effectID);
		var result = await effectToUpdate.update(updateData);

		console.log("Perk update result: ", result);
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

		var result = await ActiveEffect.create(effectData, this.item).create();
		console.log("Created? Result: ", result);
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
			}
		}

		switch (effectType)
		{
			case "bonus":
				baseEffectData.label = "Perk effect";
				baseEffectData.flags.effectSubType = "situationalPrime";
				baseEffectData.flags.path = "end";
			break;
			case "prerequisite":
				baseEffectData.label = "Perk prerequisite";
				baseEffectData.flags.effectSubType = "situationalPrime";
				baseEffectData.flags.path = "end";
			break;
			case "actionEffect":
				baseEffectData.label = "Action effect";
				baseEffectData.flags.effectSubType = "move";
				baseEffectData.flags.path = "null";
			break;
			default:
				console.error("ERROR: Unknown effect type of '" + effectType + "' found in getBlankEffectByType().");
			break;
		}

		return baseEffectData;
	}
}