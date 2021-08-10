import Component from "../../util/Component.js";

export default class Armour extends Component {
    constructor(parent) {
        super(parent);
    }

    get armour(){
        return this.gameSystem.armour || {};
    }

    get armourPath(){
        return this.gameSystemPath.with('armour');
    }

    get type() {
        return this.armour.type;
    }

    set type(type) {
        return this.write(this.armourPath.with('type'), type);
    }

    get protection() {
        return this.armour.protection;
    }

    set protection(protection) {
        return this.write(this.armourPath.with('protection'), Math.min(5, Math.max(0, protection)));
    }

    get resilience() {
        return this.armour.resilience;
    }

    set resilience(resilience) {
        return this.write(this.armourPath.with('resilience'), Math.min(5, Math.max(0, resilience)));
    }

    get keywords(){
        return this.armour.keywords || [];
    }

    set keywords(keywords){
        return this.write(this.armourPath.with('keywords'), keywords);
    }

    set toggleKeyword(keyword){
        const keywords = this.keywords;
        const index = keywords.indexOf(keyword);
        if(index < 0){
            keywords.push(keyword);
            keywords.sort();
        } else {
            keywords.splice(index,1);
        }
        this.keywords = Array.from(keywords);
    }

    get untrainedPenalties(){
        return this.armour.untrainedPenalties || [];
    }

    set untrainedPenalties(untrainedPenalties){
        return this.write(this.armourPath.with('untrainedPenalties'), untrainedPenalties);
    }

    set toggleUntrainedPenalty(untrainedPenalty){
        const untrainedPenalties = this.untrainedPenalties;
        const index = untrainedPenalties.indexOf(untrainedPenalty);
        if(index < 0){
            untrainedPenalties.push(untrainedPenalty);
            untrainedPenalties.sort();
        } else {
            untrainedPenalties.splice(index,1);
        }
        this.untrainedPenalties = Array.from(untrainedPenalties);
    }
}