import BonusItem from "./BonusItem.js";
import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";

export default class PerkItem extends BonusItem {
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

        if(this.hasSourceItem){
            return this.source.aggregateCosts(total);
        }
        return this.cost.aggregate(total);
    }
}