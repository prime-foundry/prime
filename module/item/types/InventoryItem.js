import {getComponentLazily} from "../../util/support.js";
import Metrics from "../components/Metrics.js";
import BonusItem from "./BonusItem.js";
import {Cost} from "../components/Costs.js";

export default class InventoryItem extends BonusItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get cost() {
        return getComponentLazily(this, 'cost', Cost);
    }

    aggregateCosts(total = {}){

        if(this.hasSourceItem){
            return this.source.aggregateCosts(total);
        }
        return this.cost.aggregate(total);
    }

    get metrics() {
        return getComponentLazily(this, 'metrics', Metrics);
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


    get masterCraft() {
        return this.gameSystem.masterCraft;
    }

    set masterCraft(masterCraft) {
        return this.write(this.gameSystemPath.with('masterCraft'), !!masterCraft);
    }
}