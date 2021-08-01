import BaseItem from "./BaseItem.js";

export default class InjuryItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get injuryType(){
		const injuryType = this.gameSystem.injuryType;
        return injuryType;
    }

    set injuryType(type){
        this.write(this.gameSystemPath.with('injuryType'), type);
    }
}