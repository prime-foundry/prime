import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";
import BaseItem from "./BaseItem.js";
import {Modifiers} from "../components/Modifiers.js";

export default class InventoryItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    /**
     * @return {Cost}
     */
    get cost() {
        return getComponentLazily(this, 'cost', Cost);
    }

    get modifiers(){
        return getComponentLazily(this, 'modifiers', Modifiers);
    }

    get equippable() {
        return this.gameSystem.equippable;
    }

    set equippable(equippable) {
        return this.write(this.gameSystemPath.with('equippable'), !!equippable);
    }
}