import BaseItem from "./BaseItem.js";
import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";
import {Prerequisites} from "../components/Prerequisites.js";

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
        return getComponentLazily(this, 'prerequisites', Prerequisites);
    }
}