/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BoilerplateActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
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
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:

    var soulCost = 0;
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, prime] of Object.entries(data.primes)) {
		// Calculate the modifier using d20 rules.
		// prime.mod = Math.floor((prime.value - 10) / 2);
		prime.cost = BoilerplateActor.primeCost(prime.value);
        soulCost += prime.cost;
		// mod will go but lets see what we get
        prime.mod = prime.cost;
	}
    data.soul.value = 100 - soulCost;
  }

  static primeCost(num) {
    if (num === 0) return 0;
    return (num * (num + 1))/2;
  }
}