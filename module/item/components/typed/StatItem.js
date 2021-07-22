import CommonItem from "./CommonItem.js";

export default class StatItem extends CommonItem {
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