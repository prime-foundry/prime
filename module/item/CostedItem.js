import {getComponentLazily} from "../util/support.js";
import {Cost} from "./components/Costs.js";
import BaseItem from "./BaseItem.js";

export default class CostedItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    /**
     * @return {Cost}
     */
    get money() {
        return getComponentLazily(this, 'money', Cost);
    }
}