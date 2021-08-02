import BaseItem from "./BaseItem.js";

export default class StatItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get statType(){
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
        return this.gameSystem.value;
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this.write(this.gameSystemPath.with('value'), value);
        }
    }

    get cost() {
        const num = this.value;
        return (num === 0) ? 0 : ((num * (num + 1)) / 2);
    }
}