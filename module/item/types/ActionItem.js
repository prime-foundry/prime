import BaseItem from "./BaseItem.js";
import {getComponentLazily, minmax} from "../../util/support.js";
import {ActionEffects} from "../components/ActionEffects.js";

export default class ActionItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get actionPoints() {
        return this.gameSystem.actionPoints || 0;
    }

    set actionPoints(actionPoints) {
        this.write(this.gameSystemPath.with('actionPoints'), minmax(0, actionPoints, 6));
    }

    get actionType() {
        return this.gameSystem.actionType || 0;
    }

    set actionType(actionType) {
        this.write(this.gameSystemPath.with('actionType'), actionType)
    }

    get actionEffects(){
        if(this.hasSourceItem){
            return this.source.actionEffects;
        }
        return getComponentLazily(this, 'actionEffects', ActionEffects);
    }
}