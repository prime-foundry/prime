import InventoryItem from "./InventoryItem.js";

export default class ArmourItem extends InventoryItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get equippable() {
        return true;
    }

    get armourType() {
        return this.gameSystem.armourType;
    }

    set armourType(armourType) {
        return this.write(this.gameSystemPath.with('armourType'), armourType);
    }

    get protection() {
        return this.gameSystem.protection;
    }

    set protection(protection) {
        return this.write(this.gameSystemPath.with('protection'), Math.min(5, Math.max(0, protection)));
    }

    get armourResilience() {
        return this.gameSystem.armourResilience;
    }

    set armourResilience(armourResilience) {
        return this.write(this.gameSystemPath.with('armourResilience'), Math.min(5, Math.max(0, armourResilience)));
    }

    get keywords(){
        return this.gameSystem.keywords || [];
    }

    set keywords(keywords){
        return this.write(this.gameSystemPath.with('keywords'), keywords);
    }

    toggleKeyword({value}){
        const keywords = this.keywords;
        const index = keywords.indexOf(value);
        if(index < 0){
            keywords.push(value);
            keywords.sort();
        } else {
            keywords.splice(index,1);
        }
        this.keywords = Array.from(keywords);
    }

    get untrainedPenalty(){
        return this.gameSystem.untrainedPenalty || [];
    }

    set untrainedPenalty(untrainedPenalties){
        return this.write(this.gameSystemPath.with('untrainedPenalty'), untrainedPenalties);
    }

    toggleUntrainedPenalty({value}){
        const untrainedPenalties = this.untrainedPenalty;
        const index = untrainedPenalties.indexOf(value);
        if(index < 0){
            untrainedPenalties.push(value);
            untrainedPenalties.sort();
        } else {
            untrainedPenalties.splice(index,1);
        }
        this.untrainedPenalty = Array.from(untrainedPenalties);
    }
}