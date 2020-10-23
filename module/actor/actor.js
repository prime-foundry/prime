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

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		if (actorData.type === 'character') this._prepareCharacterData(actorData);
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