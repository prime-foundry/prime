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
		console.log("Prepare data");
		super.prepareData();

		// TODO: Refactor this away.
		const actorData = this;
		// TODO: Refactor this away.
		const data = actorData;
		const flags = actorData.flags;

		if (actorData.type === 'character')
		{
			this._checkV2CharacterUpgrade();
			this._prepareCharacterData(actorData);
		}
	}

	_checkV2CharacterUpgrade()
	{
		if (!this.isVersion2() && Object.keys(this.system.primes).length === 0)
		{
			this.system.sheetVersion = "v2.0";
		}
	}

	isNPC() {
		try {
			return this.system.metadata.isNPC;
		} catch (error) {
			return true;
		}
	}

	/**
	 * Prepare Character type specific data
	 */
	async _prepareCharacterData(actorData)
	{
		const actorSystemData = actorData.system;

		// If the actor lacks an ID, then it's in the process of being created
		// but doesn't yet exist. We'll create it's items on the next pass, otherwise
		// we'll end up "duplicating" the world items as they'll be created with a
		// null ID.
		if (this.isVersion2() && this.id !== null)
		{
			await this._prepareCharacterDataV2(actorSystemData, actorData);
		}

		const primeCost = this.getTotalCost(actorSystemData.primes);
		const perkSoulCost = this.getTotalPerkCost("perkCostSoul");
		actorSystemData.soul.spent = primeCost + perkSoulCost;

		const refinementCost = this.getTotalCost(actorSystemData.refinements);
		const perkXPCost = this.getTotalPerkCost("perkCostXP");
		actorSystemData.xp.spent = refinementCost + perkXPCost;

		this.updateOwnedItemValues();

		// Loop through ability scores, and add their modifiers to our sheet output.
		actorSystemData.soul.value = (actorSystemData.soul.initial + actorSystemData.soul.awarded) - actorSystemData.soul.spent;
		actorSystemData.xp.value = (actorSystemData.xp.initial + actorSystemData.xp.awarded) - actorSystemData.xp.spent;
	}

	async _prepareCharacterDataV2(data, actorData)
	{
		const primesStatData = await this._getStatsObjects(actorData.items, "prime");
		const refinementsStatData = await this._getStatsObjects(actorData.items, "refinement");

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
		var whatPermissions = this.permission;
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
		return this.system.health.resilience.value + this.system.armour.resilience.value;
	}

	getCombinedPsyche()
	{
		return this.system.mind.psyche.value + this.system.ward.psyche.value;
	}

	/**
	 * Returns if this is a version 2 sheet or not. needed as part of migration.
	 * @return {boolean}
	 */
	isVersion2()
	{
		return !!this.system.sheetVersion && this.system.sheetVersion === "v2.0";
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
		if(typeFilter && typeFilter.length > 0) {
			const typeFilterArr = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
			return this.items.filter((item) => typeFilterArr.includes(item.type))
		}
		return this.items;
	}

	/**
	 * Returns all the primes for this actor
	 * @return {{}} an object where the property names are equal to the itemIDs.
	 * TODO: this is a legacy structure and I hate it, use a Map maybe?)
	 */
	getPrimes() {
		let results;
		if (this.isVersion2()) {
			results = {}
			this._getItems('prime')
				.map(this._getItemDataAsStat)
				.forEach(item => {
					results[item.itemID] = item;
				});
		} else {
			results = this.system.primes;
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
			results = this.system.refinements;
		}
		return results;
	}

	getTypeSortedPrimesAndRefinements()
	{
		let results = {};
		if (this.isVersion2())
		{
			console.log("getTypeSortedPrimesAndRefinements - Getting v2")
			results = this.getTypeSortedPrimesAndRefinementsV2();
		}
		else
		{
			console.log("getTypeSortedPrimesAndRefinements - Getting v1")
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
			let statType = item.system.statType;
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
		for (var key in this.system.primes)
		{
			currEntry = this.system.primes[key];
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
		for (var key in this.system.refinements)
		{
			currEntry = this.system.refinements[key];
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
				let actionType = item.system.type
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
		if (whatAction.system.default)
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
		this.system.totalWeight = this.getTotalWeight();
		this.system.equipmentCostPersonal = this.getTotalCostByType("personal");
		this.system.equipmentCostShip = this.getTotalCostByType("ship");
	}

	updateHealthAndMind()
	{
		this.system.health.wounds.max = this.system.health.wounds.base + this.getStatBonusesFromItems("health.wounds.max");
		this.system.health.resilience.max = this.system.health.resilience.base + this.getStatBonusesFromItems("health.resilience.max");
		this.system.mind.insanities.max = this.system.mind.insanities.base + this.getStatBonusesFromItems("mind.insanities.max");
		this.system.mind.psyche.max = this.system.mind.psyche.base + this.getStatBonusesFromItems("mind.psyche.max");
	}

	updateArmourValues()
	{
		var currentArmour = this.getMostResilientArmour(this.items);

		this.system.armour.protection.value = currentArmour.data.protection + this.getStatBonusesFromItems("armour.protection.value");
		this.system.armour.protection.max = currentArmour.data.protection + this.getStatBonusesFromItems("armour.protection.max");

		var initialMaxValue = this.system.armour.resilience.max
		this.system.armour.resilience.max = currentArmour.data.armourResilience + this.getStatBonusesFromItems("armour.resilience.max");

		// If they were the same initially or the value is now higher than the max, adjust accordingly.
		if (this.system.armour.resilience.value == initialMaxValue || this.system.armour.resilience.value > this.system.armour.resilience.max)
		{
			this.system.armour.resilience.value = currentArmour.data.armourResilience + this.getStatBonusesFromItems("armour.resilience.max");
		}
	}

	updateWardValues()
	{
		this.system.ward.stability.value = this.getStatBonusesFromItems("ward.stability.max");
		this.system.ward.stability.max = this.getStatBonusesFromItems("ward.stability.max");

		var initialMaxValue = this.system.ward.psyche.max
		this.system.ward.psyche.max = this.getStatBonusesFromItems("ward.psyche.max");

		// If they were the same initially or the value is now higher than the max, adjust accordingly.
		if (this.system.ward.psyche.value == initialMaxValue || this.system.ward.psyche.value > this.system.ward.psyche.max)
		{
			this.system.ward.psyche.value = this.getStatBonusesFromItems("ward.psyche.max");
		}
	}

	async _getStatsObjects(items, statType)
	{
		let matchingStatItems = {};
		let statItem = null;
		let atLeastOneStatFound = false;	// If we've found one prime, then the other stats are on their way asyncronously.
		items.forEach((currItem)=> 
		{
			if (currItem.type == statType)
			{
				statItem = this._getItemDataAsStat(currItem);
				matchingStatItems[statItem.itemID] = statItem;
				atLeastOneStatFound = true;
			}
		});

		if (Object.keys(matchingStatItems).length === 0 && !atLeastOneStatFound)
		{
			console.log("About to request world stats");
			matchingStatItems = await this._getStatObjectsFromWorld(statType);
			console.log("World stats requested and cloned");
		}

		return matchingStatItems;
	}

	async _getStatObjectsFromWorld(statType)
	{
		const currActor = this;

		let actorItemsToCreate = []
		let instancedItems = {};
		let statItem = null;
		if (ItemDirectory && ItemDirectory.collection)	// Sometimes not defined when integrated.
		{
			ItemDirectory.collection.forEach((item) =>
			{
				if (item.type == statType && item.system.default)
				{
					// Deep clone it to prevent object point related weirdness
					const itemClone = JSON.parse(JSON.stringify(item));
					console.log(`Updating sourceKey. Old: '${itemClone.system.sourceKey}', New:'${itemClone._id}'`);
					itemClone.system.sourceKey = itemClone._id;
					actorItemsToCreate.push(itemClone);
					statItem = this._getItemDataAsStat(itemClone);
					instancedItems[statItem.itemID] = statItem;
				}
			});

			if (!this.system.statCreationRequestFor) {
				this.system.statCreationRequestFor = {};
			}

			if (actorItemsToCreate.length > 0)
			{
				if (!this.system.statCreationRequestFor[statType])
				{
					this.system.statCreationRequestFor[statType] = true;
					let createdItemDocuments = await this.createEmbeddedDocuments("Item", actorItemsToCreate)
					console.log("Created stat ItemDocuments", createdItemDocuments);
				}
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
		let itemDescription = itemData.description;
		if (ItemDirectory.collection && !itemData.system.customisable)
		{
			sourceItem = ItemDirectory.collection.get(itemData.system.sourceKey);
			// We want to display the source items description to allow for updates to propagate.
			if (sourceItem)
			{
				itemTitle = sourceItem.name;
				itemDescription = sourceItem.system.description;
			}
			else
			{
				console.error(`Unable to find source stat item for key '${itemData.system.sourceKey}', raw data: `, itemData);
			}
		}

		let statData =
		{
			"value": itemData.value,
			"max": itemData.max,
			"type" : itemData.statType,
			"title": itemTitle,
			"description": itemData.customisable ? "*EDITABLE STAT, CLICK INFO TO EDIT* \n" + itemDescription : itemDescription,
			"sourceKey": itemData.system.sourceKey,
			"itemID": itemData.id,
			"itemBasedStat" : true,
			"customisableStatClass" : itemData.customisable ? "customisableStat" : "",
			"defaultItemClass" : itemData.default ? "defaultStat" : "expandedStat",
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
			var weight = currItem.system.weight;
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
			if (currItem.system.valueType == costType)
			{
				var cost = currItem.system.valueAmount;
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
		var ownedItemClones = this.getProcessedItems();
		var totalAdjustments = 0;

		for (var itemType in ownedItemClones)
		{
			var currItemClones = ownedItemClones[itemType]
			if (ownedItemClones && currItemClones)
			{
				var count = 0;
				while (count < currItemClones.length)
				{
					var currItem = currItemClones[count];
					var adjustment = this.getItemAdjustment(currItem, whatStatDataPath);
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
		while (whatItem.effects && count < whatItem.effects.length)
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