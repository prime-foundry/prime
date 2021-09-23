import BaseItem from "./BaseItem.js";
import {PrimeModifierManager} from "../PrimeModifierManager.js";
import {minmax} from "../../util/support.js";

export default class StatItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get statType() {
        return this.gameSystem.statType;
    }

    set statType(statType) {
        this.write(this.gameSystemPath.with('statType'), statType);
    }

    /**
     * @returns {number}
     */
    get max() {
        return this.gameSystem.max;
    }

    get related() {
        return [];
    }

    /**
     * @returns {number}
     */
    get value() {
        const value = this.unadjustedValue + this.activeModifiers;
        return minmax(0, value, this.max);
    }

    get unadjustedValue() {
        return super.gameSystem.value;
    }

    set unadjustedValue(value) {
        if (value <= this.max && value >= 0) {
            this.write(this.gameSystemPath.with('value'), value);
        }
    }

    get activeModifiers() {
        return PrimeModifierManager.getModifiersForItem(this.metadata.sourceKey, this.document.parent);
    }

    get cost() {
        const num = this.unadjustedValue;
        return (num === 0) ? 0 : ((num * (num + 1)) / 2);
    }
}