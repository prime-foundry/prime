import BaseItem from "./types/BaseItem.js";
import {PrimeItem} from "./PrimeItem.js";
import {PrimeItemManager} from "./PrimeItemManager.js";


/**
 * We are in danger of infinite loops with prerequisites, so we need to think of a caching strategy.
 */
export class PrimeModifierManager {

    /**
     *
     * @param {PrimeItem | BaseItem | string} item the item we are interested in.
     * @param {PrimeActor} actor
     * @param options
     * @param {boolean} (options.qualifies=true) do they need to pass the prerequisites (equipped and situational are not prerequisites)
     * @param {boolean} (options.includeSituational=false) do we include situational bonuses
     * @param {boolean} (options.includeUnequipped=false) do we include unequipped items with bonuses that require equipping
     * @returns {number}
     */
    static getModifiersForItem(item, actor, {qualifies = true, includeSituational = false, includeUnequipped=false}) {

        let sourceKey = item;
        if (sourceKey instanceof PrimeItem) {
            sourceKey = item.dyn.typed;
        }
        if (sourceKey instanceof BaseItem) {
            sourceKey = item.metadata.sourceKey;
        }

        return PrimeModifierManager.getModifiers(sourceKey, actor, {includeSituational, qualifies, includeUnequipped});
    }

    /**
     *
     * @param {string} target the target we are interested in. item sourceKey or actorStatKey.
     * @param {PrimeActor} actor
     * @param options
     * @param {boolean} (options.qualifies=true) do they need to pass the prerequisites (equipped and situational are not prerequisites)
     * @param {boolean} (options.includeSituational=false) do we include situational bonuses
     * @param {boolean} (options.includeUnequipped=false) do we include unequipped items with bonuses that require equipping
     * @returns {number}
     */
    static getModifiers(target, actor, {qualifies = true, includeSituational = false, includeUnequipped=false}) {

        const options = {qualifies, includeSituational, includeUnequipped};
        const itemCollection = actor.items;
        const perkCriteria = {
            itemCollection,
            matchAll: false,
            typed: true,
            itemBaseTypes: ["perk"]
        };

        const perkItems = PrimeItemManager.getItems(perkCriteria);

        const perkTotal = perkItems.reduce((previousValue, currentItem)=> {
            if(qualifies && !currentItem.prerequisites.qualifies()){
                return 0;
            }
            return previousValue + currentItem.modifiers.modifierFor(target, options);
        },0);

        const criteria = {
            itemCollection,
            matchAll: false,
            typed: true,
            itemBaseTypes: ["item",
                "melee-weapon",
                "ranged-weapon",
                "shield",
                "armour"]
        };

        const items = PrimeItemManager.getItems(criteria);

        const total = items.reduce((previousValue, currentItem)=> {
            return previousValue + currentItem.modifiers.modifierFor(target, options);
        }, perkTotal);

        return total;
    }

}