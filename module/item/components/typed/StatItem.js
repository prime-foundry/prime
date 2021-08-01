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
}