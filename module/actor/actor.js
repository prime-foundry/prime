import { PrimeTables } from "../prime_tables.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class PrimePCActor extends Actor
{

	/**
	 * Augment the basic actor data with additional dynamic data.
	 */
	prepareData()
	{
		super.prepareData();

		const actorData = this.data;
		const data = actorData.data;
		const flags = actorData.flags;

		if (actorData.type === 'character')
		{
			this._checkV2CharacterUpgrade();
			this._prepareCharacterData(actorData);
		}
	}

	_checkV2CharacterUpgrade()
	{
		if (this.data.data.sheetVersion == "v1.0" && Object.keys(this.data.data.primes).length === 0)
		{
			this.data.data.sheetVersion = "v2.0";
		}
	}

	isNPC() {
		try {
			return this.data.data.metadata.isNPC;
		} catch (error) {
			return true;
		}
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData)
	{
		const data = actorData.data;

		if (this.isVersion2())
		{
			this._prepareCharacterDataV2(data, actorData);
		}

		const primeCost = this.getTotalCost(data.primes);
		const perkSoulCost = this.getTotalPerkCost("perkCostSoul");
		data.soul.spent = primeCost + perkSoulCost;

		const refinementCost = this.getTotalCost(data.refinements);
		const perkXPCost = this.getTotalPerkCost("perkCostXP");
		data.xp.spent = refinementCost + perkXPCost;

		this.updateOwnedItemValues();

		// Loop through ability scores, and add their modifiers to our sheet output.
		data.soul.value = (data.soul.initial + data.soul.awarded) - data.soul.spent;
		data.xp.value = (data.xp.initial + data.xp.awarded) - data.xp.spent;
	}

	_prepareCharacterDataV2(data, actorData)
	{
		const primesStatData = this._getStatsObjects(actorData.items, "prime");
		const refinementsStatData = this._getStatsObjects(actorData.items, "refinement");

		if (data.primes)
		{
			data.primes = primesStatData;
		}
		if (data.refinements)
		{
			data.refinements = refinementsStatData;
		}
	}

	getCurrentOwners(whatPermissions)
	{
		var whatPermissions = this.data.permission;
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

	getCombinedResilience()
	{
		return this.data.data.health.resilience.value + this.data.data.armour.resilience.value;
	}

	getCombinedPsyche()
	{
		return this.data.data.mind.psyche.value + this.data.data.ward.psyche.value;
	}

	/**
	 * Returns if this is a version 2 sheet or not. needed as part of migration.
	 * @return {boolean}
	 */
	isVersion2(){
		return !!this.data.data.sheetVersion && this.data.data.sheetVersion === "v2.0";
	}

	/**
	 * Fetches all the items off the actor.
	 * If a type filter is provided (string or an array of strings), then the items are filtered by the provided types,
	 * if the string or array is empty, it will return all items.
	 * if you provide any non string or array, that it will return all the items.
	 *
	 * @param {string, Array.<string>} (typeFilter) a single type filter, or an array of type filters.
	 * @return {*} a list of items.
	 * @private
	 */
	_getItems(typeFilter) {
		if(typeFilter && typeFilter.length > 0){
			const typeFilterArr = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
			return this.data.items.filter((item) => typeFilterArr.includes(item.type))
		}
		return this.data.items;
	}

	/**
	 * Returns all the primes for this actor
	 * @return {{}} an object where the property names are equal to the itemIDs.
	 * TODO: this is a legacy structure and I hate it, use a Map maybe?)
	 */
	getPrimes() {
		let results;
		if(this.isVersion2()){
			results = {}
			this._getItems('prime')
				.map(this._getItemDataAsStat)
				.forEach(item => {
					results[item.itemID] = item;
				});
		} else {
			results = this.data.data.primes;
		}
		return results;
	}

	/**
	 * Returns all the refinements for this actor
	 * @return {{}} an object where the property names are equal to the itemIDs.
	 * TODO: this is a legacy structure and I hate it, use a Map maybe?)
	 */
	getRefinements() {
		let results;
		if(this.isVersion2()){
			results = {};
			this._getItems('refinement')
				.map(this._getItemDataAsStat)
				.forEach(item => {
					results[item.itemID] = item;
				});
		} else {
			results = this.data.data.refinements;
		}
		return results;
	}

	getTypeSortedPrimesAndRefinements()
	{
		let results = {};
		if (this.isVersion2())
		{
			results = this.getTypeSortedPrimesAndRefinementsV2();
		}
		else
		{
			results = this.getTypeSortedPrimesAndRefinementsV1();
		}
		return results;
	}

	getTypeSortedPrimesAndRefinementsV2()
	{
		//HACKY: Workaround to force the order.
		let sortedData =
		{
			"physical": {
				primes: {},
				refinements: {},
				title: null
			},
			"mental": {
				primes: {},
				refinements: {},
				title: null
			},
			"supernatural": {
				primes: {},
				refinements: {},
				title: null
			},
		};
		this._getItems(['prime' ,'refinement']).forEach((item) =>
		{
			let itemType = item.type
			let statType = item.data.statType;
			if (!sortedData[statType].title)
			{
				let localisedTitle = game.i18n.localize("PRIME.stat_type_" + statType);
				sortedData[statType].title = localisedTitle;
			}
			let itemDataAsStat = this._getItemDataAsStat(item);
			sortedData[statType][itemType + "s"][itemDataAsStat.itemID] = itemDataAsStat;
		});

		return sortedData;
	}

	getTypeSortedPrimesAndRefinementsV1()
	{
		var sortedData = {};
		var currEntry = null;
		for (var key in this.data.data.primes)
		{
			currEntry = this.data.data.primes[key];
			if (!sortedData[currEntry.type])
			{
				let localisedTitle = game.i18n.localize("PRIME.stat_type_" + currEntry.type);
				sortedData[currEntry.type] =
				{
					primes: {},
					refinements: {},
					title: localisedTitle
				}
			}
			sortedData[currEntry.type].primes[key] = currEntry;
		}
		for (var key in this.data.data.refinements)
		{
			currEntry = this.data.data.refinements[key];
			sortedData[currEntry.type].refinements[key] = currEntry;
		}

		let sortedDataClone = $.extend(true, {}, sortedData);

		PrimeTables.addTranslations(sortedDataClone);

		return sortedDataClone;
	}

	getProcessedItems()
	{
		var filteredItems = this.filterAndCloneItemsByType();
		return filteredItems;
	}

	filterAndCloneItemsByType()
	{
		var itemClonesByTypes = {}

		this.items.forEach(function(currItem, key, map)
		{
			if (!itemClonesByTypes[currItem.type])
			{
				itemClonesByTypes[currItem.type] = [];
			}

			let processedCloneItem = currItem.getProcessedClone(currItem);

			itemClonesByTypes[currItem.type].push(processedCloneItem);
		});

		return itemClonesByTypes;
	}

	getSortedActions()
	{
		var typeSortedActions = {};

		ItemDirectory.collection.forEach((item, key, items) =>
		{
			if (item.type == "action")
			{
				let actionType = item.data.data.type
				if (!typeSortedActions[actionType])
				{
					typeSortedActions[actionType] = [];
				}

				var isAllowedForCharacter = this.isAllowedForCharacter(item)
				if (isAllowedForCharacter)
				{
					typeSortedActions[actionType].push(item);
				}
			}
		});

		return typeSortedActions;
	}

	isAllowedForCharacter(whatAction)
	{
		if (whatAction.data.data.default)
		{
			return true;
		}

		var ownedPerkClones = this.getProcessedItems()["perk"];

		if (ownedPerkClones)
		{
			var count = 0;
			while (count < ownedPerkClones.length)
			{
				var currPerk = ownedPerkClones[count];
				var unlocksAction = this.checkPerkActionUnlock(currPerk, whatAction);
				if (unlocksAction)
				{
					return unlocksAction;
				}
				count++;
			}
		}

		return false;
	}

	checkPerkActionUnlock(whatPerk, whatAction)
	{
		var count = 0
		while (count < whatPerk.effects.length)
		{
			let currPerkEffect = whatPerk.effects[count];

			if (currPerkEffect.flags.effectType == "bonus" && currPerkEffect.flags.effectSubType == "extraAction" && currPerkEffect.flags.path == whatAction.id)
			{
				return true;
			}

			count++;
		}
		return false;
	}

	getTotalPerkCost(perkCostType)
	{
		var ownedPerkClones = this.getProcessedItems()["perk"];
		var totalCost = 0;

		if (ownedPerkClones)
		{
			var count = 0;
			while (count < ownedPerkClones.length)
			{
				var currPerk = ownedPerkClones[count];
				if (currPerk.data.cost.attributeType == perkCostType)
				{
					totalCost += currPerk.data.cost.amount;
				}
				count++;
			}
		}

		return totalCost;
	}

	getTotalCost(whatItems)
	{
		var totalCost = 0;
		// Mostly a failsafe, hopefully new characters will only be created
		// after the world has prime & refinement items added.
		if (!whatItems)
		{
			return totalCost;
		}

		for (let [key, item] of Object.entries(whatItems))
		{
			// Calculate the modifier using d20 rules.
			// prime.mod = Math.floor((prime.value - 10) / 2);
			item.cost = PrimePCActor.primeCost(parseInt(item.value));
			totalCost += item.cost;
			// mod will go but lets see what we get
			item.mod = item.cost;
		}
		return totalCost;
	}

	updateOwnedItemValues()
	{
		this.updateWeightAndValue();

		this.updateHealthAndMind();
		this.updateArmourValues();
		this.updateWardValues();

		//var result = await this.update(this.data);
	}

	updateWeightAndValue()
	{
		this.data.data.totalWeight = this.getTotalWeight();
		this.data.data.equipmentCostPersonal = this.getTotalCostByType("personal");
		this.data.data.equipmentCostShip = this.getTotalCostByType("ship");
	}

	updateHealthAndMind()
	{
		const health = this.data.data.health;
		const mind = this.data.data.mind;
		health.wounds.max = health.wounds.base + this.getStatBonusesFromItems("health.wounds.max");
		health.resilience.max = health.resilience.base + this.getStatBonusesFromItems("health.resilience.max");
		mind.insanities.max = mind.insanities.base + this.getStatBonusesFromItems("mind.insanities.max");
		mind.psyche.max = mind.psyche.base + this.getStatBonusesFromItems("mind.psyche.max");
		const setValueToMaxIfNull = (obj) => {
			if (obj.value == null) {
				obj.value = obj.max;
			}
		}
		setValueToMaxIfNull(health.wounds);
		setValueToMaxIfNull(health.resilience);
		setValueToMaxIfNull(mind.insanities);
		setValueToMaxIfNull(mind.psyche);
	}


	updateArmourValues()
	{
		var currentArmour = this.getMostResilientArmour(this.data.items);

		this.data.data.armour.protection.value = currentArmour.data.protection + this.getStatBonusesFromItems("armour.protection.value");
		this.data.data.armour.protection.max = currentArmour.data.protection + this.getStatBonusesFromItems("armour.protection.max");

		var initialMaxValue = this.data.data.armour.resilience.max
		this.data.data.armour.resilience.max = currentArmour.data.armourResilience + this.getStatBonusesFromItems("armour.resilience.max");

		// If they were the same initially or the value is now higher than the max, adjust accordingly.
		if (this.data.data.armour.resilience.value == initialMaxValue || this.data.data.armour.resilience.value > this.data.data.armour.resilience.max)
		{
			this.data.data.armour.resilience.value = currentArmour.data.armourResilience + this.getStatBonusesFromItems("armour.resilience.max");
		}
	}

	updateWardValues()
	{
		this.data.data.ward.stability.value = this.getStatBonusesFromItems("ward.stability.max");
		this.data.data.ward.stability.max = this.getStatBonusesFromItems("ward.stability.max");

		var initialMaxValue = this.data.data.ward.psyche.max
		this.data.data.ward.psyche.max = this.getStatBonusesFromItems("ward.psyche.max");

		// If they were the same initially or the value is now higher than the max, adjust accordingly.
		if (this.data.data.ward.psyche.value == initialMaxValue || this.data.data.ward.psyche.value > this.data.data.ward.psyche.max)
		{
			this.data.data.ward.psyche.value = this.getStatBonusesFromItems("ward.psyche.max");
		}
	}

	_getStatsObjects(items, statType)
	{
		let matchingStatItems = {};
		let count = 0;
		let currItem = null;
		let statItem = null;
		let atLeastOneStatFound = false;	// If we've found one prime, then the other stats are on their way asyncronously.
		while (count < items.length)
		{
			currItem = items[count];
			if (currItem.type == statType)
			{
				statItem = this._getItemDataAsStat(currItem);
				matchingStatItems[statItem.itemID] = statItem
			}
			if (currItem.type == "prime" || currItem.type == "refinement")
			{
				atLeastOneStatFound = true;
			}
			count++;
		}

		if (Object.keys(matchingStatItems).length === 0 && !atLeastOneStatFound)
		{
			matchingStatItems = this._getStatObjectsFromWorld(statType);
		}

		return matchingStatItems;
	}

	_getStatObjectsFromWorld(statType)
	{
		const currActor = this;

		let actorItemsToCreate = []
		let instancedItems = {};
		let statItem = null;
		if (ItemDirectory && ItemDirectory.collection)	// Sometimes not defined when interegated.
		{
			ItemDirectory.collection.forEach((item, key, items) =>
			{
				if (item.type == statType && item.data.data.default)
				{
					item.data.data.sourceKey = item.data._id;
					actorItemsToCreate.push(item.data);
					statItem = this._getItemDataAsStat(item.data);
					instancedItems[statItem.itemID] = statItem;
				}
			});

			if (actorItemsToCreate.length > 0)
			{
				this.createEmbeddedEntity("OwnedItem", actorItemsToCreate);
			}
			else
			{
				console.error(`No stat items of type ${statType} were found in _getStatObjectsFromWorld(). Did you forget to import from Compendium?`);
			}
		}
		else
		{
			console.warn("getStatObjectsFromWorld() was called to soon. The world (and the items) weren't ready yet.")
		}
		return instancedItems;
	}

	// "athletic" :
	// {
	// 	"value": 0,
	// 	"max": 10,
	// 	"related" : ["mov", "str"],
	// 	"type" : "physical",
	// 	"title": "PRIME.refinment_title_athletic",
	// 	"description": "PRIME.refinment_description_athletic"
	// },

	_getItemDataAsStat(itemData)
	{
		let sourceItem = null;
		let itemTitle = itemData.name;
		let itemDescription = itemData.data.description;
		if (ItemDirectory.collection && !itemData.data.customisable)
		{
			sourceItem = ItemDirectory.collection.get(itemData.data.sourceKey);
			if (sourceItem)
			{
				itemTitle = sourceItem.data.name;
				itemDescription = sourceItem.data.data.description;
			}
			else
			{
				console.error("Unable to find source stat item for: ", itemData);
			}
		}

		let statData =
		{
			"value": itemData.data.value,
			"max": itemData.data.max,
			"type" : itemData.data.statType,
			"title": itemTitle,
			"description": itemData.data.customisable ? "*EDITABLE STAT, CLICK INFO TO EDIT* \n" + itemDescription : itemDescription,
			"sourceKey": itemData.data.sourceKey,
			"itemID": itemData._id,
			"itemBasedStat" : true,
			"customisableStatClass" : itemData.data.customisable ? "customisableStat" : "",
			"defaultItemClass" : itemData.data.default ? "defaultStat" : "expandedStat",
		}

		if (itemData.related)
		{
			statData.related = itemData.related;
		}

		return statData;
	}

	getMostResilientArmour(items)
	{
		var bestArmour =
		{
			data: {armourResilience: 0, protection: 0}
		};
		var currItem = null;
		var count = 0;
		while (count < items.length)
		{
			currItem = items[count];
			if (currItem.type == "armour" && currItem.data.isWorn && currItem.data.armourResilience > bestArmour.data.armourResilience)
			{
				bestArmour = currItem;
			}
			count++;
		}
		return bestArmour;
	}

	getTotalWeight()
	{
		var totalWeight = 0;
		this.items.forEach(function(currItem, key, map)
		{
			var weight = currItem.data.data.weight;
			var parsedWeight = parseInt(weight);
			if (weight &&  !isNaN(parsedWeight))
			{
				totalWeight += parsedWeight;
			}
		});
		return totalWeight;
	}

	getTotalCostByType(costType)
	{
		var totalCost = 0;
		this.items.forEach(function(currItem, key, map)
		{
			if (currItem.data.data.valueType == costType)
			{
				var cost = currItem.data.data.valueAmount;
				var parsedCost = parseInt(cost);
				if (cost &&  !isNaN(parsedCost))
				{
					totalCost += parsedCost;
				}
			}
		});
		return totalCost;
	}

	getStatBonusesFromItems(whatStatDataPath)
	{
		const ownedItemClones = this.getProcessedItems();
		let totalAdjustments = 0;

		for (let itemType in ownedItemClones)
		{
			const currItemClones = ownedItemClones[itemType]
			if (ownedItemClones && currItemClones)
			{
				let count = 0;
				while (count < currItemClones.length)
				{
					const currItem = currItemClones[count];
					const adjustment = this.getItemAdjustment(currItem, whatStatDataPath);
					totalAdjustments += adjustment;
					count++;
				}
			}
		}
		return totalAdjustments;
	}

	getItemAdjustment(whatItem, whatStatDataPath)
	{
		var itemStateAdjustments = 0;
		var count = 0;
		while (count < whatItem.effects.length)
		{
			let currEffect = whatItem.effects[count];
			if (currEffect.flags.effectType == "bonus" && currEffect.flags.effectSubType == "actorStatBonus" && currEffect.flags.path == whatStatDataPath)
			{
				var parseValue = parseInt(currEffect.flags.value);
				if (!isNaN(parseValue))
				{
					itemStateAdjustments += parseValue;
				}
				else
				{
					console.error("ERROR: Found a stat adjustment value I couldn't turn into a bonus. Item / Effect", whatItem, currEffect);
				}
			}
			count++;
		}

		return itemStateAdjustments
	}

	static primeCost(num)
	{
		if (num === 0) return 0;
		return (num * (num + 1)) / 2;
	}
}