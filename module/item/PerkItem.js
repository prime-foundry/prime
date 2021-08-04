import BaseItem from "./BaseItem.js";
import {getComponentLazily} from "../util/support.js";
import {Cost} from "./components/Costs.js";

export default class PerkItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    /**
     * @return {Cost}
     */
    get cost() {
        return getComponentLazily(this, 'cost', Cost);
    }

    get bonuses() {
        return null;
    }
    get prerequisites(){
        /* [
         * key(?type)
         * actualCount
         * effectSubType: string
         * path
         * dynamicDataForEffectTarget: []
         * value
         * effectId
         * ]
         */
        return [];
    }
}