import BaseItem from "./BaseItem.js";
import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";
import {Prerequisites} from "../components/Prerequisites.js";
import {Modifiers} from "../components/Modifiers.js";

export default class PerkItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    /**
     * @return {Cost}
     */
    get cost() {
        if(this.hasSourceItem){
            return this.sourceItem.cost;
        }
        return getComponentLazily(this, 'cost', Cost);
    }

    aggregateCosts(total = {}){
        if(this.hasSourceItem){
            return this.sourceItem.aggregateCosts(total);
        }
        return this.cost.aggregate(total);
    }

    get prerequisites(){
        if(this.hasSourceItem){
            return this.sourceItem.prerequisites;
        }
        return getComponentLazily(this, 'prerequisites', Prerequisites);
    }

    qualifies(actorDoc = this.document.parent) {
        return this.prerequisites.qualifies(actorDoc);
    }

    get modifiers(){
        if(this.hasSourceItem){
            return this.sourceItem.modifiers;
        }
        return getComponentLazily(this, 'modifiers', Modifiers);
    }
}