import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";
import BaseItem from "./BaseItem.js";
import {Modifiers} from "../components/Modifiers.js";
import {Prerequisites} from "../components/Prerequisites.js";

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

    aggregateCosts(total = {}){
        return this.cost.aggregate(total);
    }

    get modifiers(){
        if(this.hasSourceItem){
            return this.sourceItem.modifiers;
        }
        return getComponentLazily(this, 'modifiers', Modifiers);
    }

    get prerequisites(){
        if(this.hasSourceItem){
            return this.sourceItem.prerequisites;
        }
        return getComponentLazily(this, 'prerequisites', Prerequisites);
    }

    get equipped() {
        return this.equippable && this.gameSystem.equipped;
    }


    set equipped(equipped) {
        if(this.equippable){
            return this.write(this.gameSystemPath.with('equipped'), !!equipped);
        }
    }

    get equippable() {
        return this.gameSystem.equippable;
    }

    set equippable(equippable) {
        return this.write(this.gameSystemPath.with('equippable'), !!equippable);
    }
}