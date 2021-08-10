import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";
import BaseItem from "./BaseItem.js";
import {Modifiers} from "../components/Modifiers.js";
import {Prerequisites} from "../components/Prerequisites.js";

export default class BonusItem extends BaseItem {

    constructor(primeItem) {
        super(primeItem);
    }

    get modifiers(){
        return getComponentLazily(this, 'modifiers', Modifiers);
    }

    modifierFor(actorDoc, ownedItem, target, options = {}) {
        if(this.hasSourceItem){
            return this.source.modifierFor(actorDoc, ownedItem, target, options);
        }
        return this.modifiers.modifierFor(actorDoc, ownedItem, target, options);
    }

    get prerequisites(){
        return getComponentLazily(this, 'prerequisites', Prerequisites);
    }

    qualifies(actorDoc = this.document.parent) {

        if(this.hasSourceItem){
            return this.source.qualifies(actorDoc);
        }
        return this.prerequisites.qualifies(actorDoc);
    }
}