import {DynDocumentMixin} from "../util/DynFoundryMixins.js";
import StatItem from "./types/StatItem.js";
import InjuryItem from "./types/InjuryItem.js";
import PerkItem from "./types/PerkItem.js";
import InventoryItem from "./types/InventoryItem.js";
import WeaponItem from "./types/WeaponItem.js";
import BaseItem from "./types/BaseItem.js";
import ActionItem from "./types/ActionItem.js";
import ArmourItem from "./types/ArmourItem.js";
import RangedWeaponItem from "./types/RangedWeaponItem.js";
import ShieldItem from "./types/ShieldItem.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class PrimeItem extends DynDocumentMixin(Item, 'item', 'type') {

    /**
     * These are the types returned on the model named item, instead of this Document.
     * This allows us to have typed values. If a default is not provided, then it will return the document.
     *
     * @param registry
     */
    registerDynTypes(registry) {
        registry
            .default(BaseItem)
            .register('item', InventoryItem)
            .register('melee-weapon', WeaponItem)
            .register('ranged-weapon', RangedWeaponItem)
            .register('shield', ShieldItem)
            .register('armour', ArmourItem)
            .register('prime', StatItem)
            .register('refinement', StatItem)
            .register('perk', PerkItem)
            .register('injury', InjuryItem)
            .register('award', BaseItem)
            .register('action', ActionItem);

    }

    _onCreate(data, options, userId) {
        const typed = this.dyn.typed;
        typed.audit.onUpdate(userId);
        return this.dyn.dataManager.commit();
    }
}