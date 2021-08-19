import BaseItem from "./BaseItem.js";
import {getComponentLazily} from "../../util/support.js";
import {Modifiers} from "../components/Modifiers.js";
const STATUS = {
    TENDED: "tended",
    UNTENDED: "untended",
    HEALED: "healed"
}
export default class InjuryItem extends BaseItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get injuryState(){
        const status = this.gameSystem.injuryState;
        return status;
    }

    set injuryState(injuryState){
        this.write(this.gameSystemPath.with('injuryState'), injuryState);
    }

    get tended(){
        return this.injuryState === STATUS.TENDED;
    }
    get untended(){
        return this.injuryState === STATUS.UNTENDED;
    }
    get healed() {
        return this.injuryState === STATUS.HEALED;
    }

    tend(){
        this.injuryState = STATUS.TENDED;
    }

    cure(){
        this.injuryState = STATUS.HEALED;
    }

    aggravate(){
        this.injuryState = STATUS.UNTENDED;
    }

    get injuryType(){
		const injuryType = this.gameSystem.injuryType;
        return injuryType;
    }

    set injuryType(type){
        this.write(this.gameSystemPath.with('injuryType'), type);
    }

    get untendedModifiers(){
        return getComponentLazily(this, 'untendedModifiers', Modifiers, 'untendedModifiers');
    }

    get tendedModifiers(){
        return getComponentLazily(this, 'tendedModifiers', Modifiers, 'tendedModifiers');
    }

    get permanentModifiers(){
        return getComponentLazily(this, 'permanentModifiers', Modifiers, 'permanentModifiers');
    }

    modifierFor(actorDoc, ownedItem, target, options = {}) {
        // always pull from the source item.
        const item = this.hasSourceItem ? this.source : this;
        let activeModifiers;
        switch(this.status){
            case STATUS.UNTENDED: {
                activeModifiers = item.untendedModifiers;
                break;
            }
            case STATUS.TENDED: {
                activeModifiers = item.tendedModifiers;
                break;
            }
            case STATUS.HEALED:
            default: {
                activeModifiers = item.permanentModifiers;
                break;
            }
        }

        return activeModifiers.modifierFor(actorDoc, ownedItem, target, options);
    }
}