import BaseItem from "./types/BaseItem.js";
import {PrimeItem} from "./PrimeItem.js";
import {PrimeItemManager} from "./PrimeItemManager.js";
import Component from "../util/Component.js";


/**
 * We are in danger of infinite loops with prerequisites, so we need to think of a caching strategy.
 */
export class PrimeModifierManager {

    static getCosts(itemCollection = ItemDirectory.collection){

        const criteria = {
            itemCollection,
            matchAll: false,
            typed: true
        };
        const items = PrimeItemManager.getItems(criteria);
        const total = {}

        for(const item of items) {
            item.aggregateCosts(total);
        }
        return total;
    }

    static getCostsForType(itemCollection = ItemDirectory.collection, type){
        return PrimeModifierManager.getCosts(itemCollection)[type] || 0;
    }

    /**
     *
     * @param {PrimeItem | BaseItem | string} item the item we are interested in.
     * @param {PrimeActor | Component} actor
     * @param options
     * @param {boolean} (options.qualifies=true) do they need to pass the prerequisites (equipped and situational are not prerequisites)
     * @param {boolean} (options.includeSituational=false) do we include situational bonuses
     * @param {boolean} (options.includeUnequipped=false) do we include unequipped items with bonuses that require equipping
     * @returns {number}
     */
    static getModifiersForItem(item, actor, options ={}) {
        let sourceKey = item;
        if (sourceKey instanceof PrimeItem) {
            sourceKey = item.dyn.typed;
        }
        if (sourceKey instanceof BaseItem) {
            sourceKey = item.metadata.sourceKey;
        }

        return PrimeModifierManager.getModifiers(sourceKey, actor, options);
    }

    /**
     *
     * @param {string} target the target we are interested in. item sourceKey or actorStatKey.
     * @param {PrimeActor | Component} actor
     * @param options
     * @param {boolean} (options.qualifies=true) do they need to pass the prerequisites (equipped and situational are not prerequisites)
     * @param {boolean} (options.includeSituational=false) do we include situational bonuses
     * @param {boolean} (options.includeUnequipped=false) do we include unequipped items with bonuses that require equipping
     * @returns {number}
     */
    static getModifiers(target, actorOrComponent, options ={}) {
        target = target.replaceAll('.', '_');
        let actorDoc = actorOrComponent instanceof Component ? actorOrComponent.document : actorOrComponent;
        if(actorDoc.qualifying){
            return 0;
        }
        try {
        actorDoc.qualifying = true;
        const itemCollection = actorDoc.items;
        const perkCriteria = {
            itemCollection,
            matchAll: false,
            typed: true,
            itemBaseTypes: ["perk"]
        };

        const perkItems = PrimeItemManager.getItems(perkCriteria);
        const {qualifies = true} = options

        const perkTotal = perkItems.reduce((previousValue, ownedItem)=> {
            if(qualifies && !ownedItem.prerequisites.qualifies(actorDoc, ownedItem)){
                return 0;
            }
            return previousValue + ownedItem.modifiers.modifierFor(actorDoc, ownedItem, target, options);
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

        const total = items.reduce((previousValue, ownedItem)=> {
            return previousValue + ownedItem.modifiers.modifierFor(actorDoc, ownedItem, target, options);
        }, perkTotal);

        return total;

        } finally {
            delete actorDoc.qualifying;
        }
    }

}