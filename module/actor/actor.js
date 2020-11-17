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

		const primeCost = this.getTotalCost(data.primes);
		const perkSoulCost = this.getTotalPerkCost("perkCostSoul");
		data.soul.spent = primeCost + perkSoulCost;


		const refinementCost = this.getTotalCost(data.refinements);
		const perkXPCost = this.getTotalPerkCost("perkCostXP");
		data.xp.spent = refinementCost + perkXPCost;

		this.updateHealthAndMind(data);

		// Loop through ability scores, and add their modifiers to our sheet output.

		data.soul.value = (data.soul.initial + data.soul.awarded) - data.soul.spent;
		data.xp.value = (data.xp.initial + data.xp.awarded) - data.xp.spent;
	}

	updateHealthAndMind(data)
	{
		data.health.wounds.max = data.health.wounds.base + this.getStateBonusesFromPerks("health.wounds.max");
		data.health.resilience.max = data.health.resilience.base + this.getStateBonusesFromPerks("health.resilience.max");
		data.mind.insanities.max = data.mind.insanities.base + this.getStateBonusesFromPerks("mind.insanities.max");
		data.mind.psyche.max = data.mind.psyche.base + this.getStateBonusesFromPerks("mind.psyche.max");
		// health.wounds.max
		// health.resilience.max

		// mind.insanities.max
		// mind.psyche.max
	}

	getStateBonusesFromPerks(whatStatDataPath)
	{
		var ownedPerkClones = this.getProcessedItems()["perk"];
		var totalAdjustments = 0;

		if (ownedPerkClones)
		{
			var count = 0;
			while (count < ownedPerkClones.length)
			{
				var currPerk = ownedPerkClones[count];
				var adjustment = this.getPerkAdjustment(currPerk, whatStatDataPath);
				totalAdjustments += adjustment;
				// if (currPerk.data.cost.attributeType == perkCostType)
				// {
				// 	totalAdjustments += currPerk.data.cost.amount;
				// }
				count++;
			}
		}

		return totalAdjustments;
	}

	getPerkAdjustment(whatPerk, whatStatDataPath)
	{
		var perkStateAdjustments = 0;
		var count = 0;
		while (count < whatPerk.effects.length)
		{
			let currEffect = whatPerk.effects[count];
			if (currEffect.flags.effectType == "bonus" && currEffect.flags.effectSubType == "actorStatBonus" && currEffect.flags.path == whatStatDataPath)
			{
				var parseValue = parseInt(currEffect.flags.value);
				if (!isNaN(parseValue))
				{
					perkStateAdjustments += parseValue;
				}
				else
				{
					console.error("ERROR: Found a stat adjustment value I couldn't turn into a bonus. Perk / Effect", whatPerk, currEffect);
				}
			}
			count++;
		}

		return perkStateAdjustments
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
		//"perkCostSoul"
		//("perkCostXP");
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