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
			this._prepareCharacterData(actorData);
		}
	}


	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData)
	{
		const data = actorData.data;

		// Make modifications to data here. For example:

		data.soul.spent = this.getTotalCost(data.primes);
		data.xp.spent = this.getTotalCost(data.refinements);
		// Loop through ability scores, and add their modifiers to our sheet output.

		data.soul.value = (data.soul.initial + data.soul.awarded) - data.soul.spent;
		data.xp.value = (data.xp.initial + data.xp.awarded) - data.xp.spent;
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

	getTypeSortedPrimesAndRefinements()
	{
		var sortedData = {};
		var currEntry = null;
		for (var key in this.data.data.primes)
		{
			currEntry = this.data.data.primes[key];
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

	getTotalCost(whatItems)
	{
		var totalCost = 0;
		for (let [key, item] of Object.entries(whatItems))
		{
			// Calculate the modifier using d20 rules.
			// prime.mod = Math.floor((prime.value - 10) / 2);
			item.cost = PrimePCActor.primeCost(item.value);
			totalCost += item.cost;
			// mod will go but lets see what we get
			item.mod = item.cost;
		}
		return totalCost;
	}

	static primeCost(num)
	{
		if (num === 0) return 0;
		return (num * (num + 1)) / 2;
	}

	
}