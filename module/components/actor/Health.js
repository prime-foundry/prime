import ActorComponent from './util/ActorComponent.js';
import {BaseValueMaxComponent, BaseMaxComponent} from './util/ActorComponentSupport.js';
import Util from "../util/Util.js";

export default class Health extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    /**
     * @return {Wounds}
     */
    get wounds() {
        return Util.getComponentLazily(this, 'wounds', Wounds);
    }

    set wounds(value) {
        this.wounds.value = value;
    }

    /**
     * @return {Resilience}
     */
    get resilience() {
        return Util.getComponentLazily(this, 'resilience', Resilience);
    }

    set resilience(value) {
        this.resilience.value = value;
    }

    /**
     * @return {Insanities}
     */
    get insanities() {
        return Util.getComponentLazily(this, 'insanities', Insanities);
    }

    set insanities(value) {
        this.insanities.value = value;
    }

    /**
     * @return {Psyche}
     */
    get psyche() {
        return Util.getComponentLazily(this, 'psyche', Psyche);
    }

    set psyche(value) {
        this.psyche.value = value;
    }
}

/**
 * Injuries have 2 states
 * Tended,
 * Tended wounds are persistant and might come back.
 * Healed,
 * Healed wounds are gone.
 */
class InjurableStat extends BaseMaxComponent {
    constructor(parent) {
        super(parent);
    }

    /**
     * If the injuries are tended, then the injuries count as not existing towards the total. However we need to accommodate it on the UI.
     * @return {*}
     */
    get slots() {
        return this.max;
    }

    get value() {
        return this._injuriesRead.filter(injury => !!injury).length
    }

    get injuries() {
        return this._injuriesRead.filter(injury => !!injury).map(injury => {
            return {tended: injury.tended, detail: injury.detail}
        })
    }
    sort() {
        // tended first
        // followed by injuries with details, ordered alphabetcally
        const injuries = this._injuriesRead
            .filter(injury => !!injury)
            .sort((firstInjury, secondInjury) => {
                if(firstInjury.tended ^ secondInjury.tended){
                    return firstInjury.tended ? -1 : +1;
                }
                if(firstInjury.detail != null){
                    return secondInjury.detail == null ? - 1 : firstInjury.detail.localeCompare(secondInjury.detail);
                }
                return secondInjury.detail == null ? 0 : +1;
            });
        // We just override the injuries with the whole array.
        this._statsWrite.injuries = injuries;
    }

    getInjury(index) {
        return this._injuriesRead[index];
    }

    injure({index, selected: detail}) {
        const oldInjury = this._injuriesRead[index];
        if (oldInjury) {
            this._injuriesWrite[index].detail = detail;
        } else {
            this._injuriesWrite[index] = {detail, tended: false};
        }
    }

    isInjured({index}) {
        return this._injuriesRead[index] != null;
    }

    isHealthy({index}) {
        return this._injuriesRead[index] == null;
    }

    isTended({index}) {
        const injury = this._injuriesRead[index];
        return !!injury && !!injury.tended;
    }

    isUntended({index}) {
        const injury = this._injuriesRead[index];
        return !!injury && !injury.tended;
    }

    /**
     * UI function
     * @param index
     * @returns {null|T|number|T|*}
     */
    injuryDetail({index}) {
        const injury = this._injuriesRead[Number.parseInt(index)] || {};
        return injury.detail
    }

    aggravate(index) {
        const injury = this._injuriesRead[index];
        if (injury && injury.tended) {
            this._injuriesWrite[index].tended = false;
        }
    }


    /**
     * UI Function
     * @param index
     */
    cure({index}) {
        const injury = this._injuriesRead[index];
        if (injury) {
            // delete item at index.
            this._injuriesWrite[index] = null;
        }
    }

    /**
     * UI Function
     * @param activate
     * @param inputPrimeData
     */
    aggravateOrAlleviate({activate, value: index}) {
        const injuriesRead = this._injuriesRead;
        const injury = injuriesRead[index];
        // if we have activated this wound,
        if (activate) {
            // and we have an injury already in this slot
            if (injury) {
                // and the wound is dormant lets aggravate it.
                this.aggravate(index);
            } else {
                // or the wound is not there lets fill with injuries until we have achieved the recommended number of values.
                // if there are no wounds above.
                const injuriesWrite = this._injuriesWrite;
                if (injuriesRead.slice(index).filter(injury => !!injury).length === 0) {
                    let count = index - 1;
                    while (count >= 0 && injuriesRead[count] == null) {
                        injuriesWrite[count] = {tended: false, detail: null};
                        count -= 1;
                    }
                }
                injuriesWrite[index] = {tended: false, detail: null};
            }
            // if we are not activating a wound, and the wound is not tended
        } else if (injury && !injury.tended) {
            // tend the wound
            const injuriesWrite = this._injuriesWrite;
            injuriesWrite[index].tended = true;
            // if there are no details on this wound, then lets heal it completely. its a mistake, lets be friendly in our UI
            if ((!injury.detail) || injury.detail == '') {
                injuriesWrite[index] = null;
            }
        }
    }

    get _pointsRead() {
        return this._statsRead.wounds;
    }

    get _pointsWrite() {
        return this._statsWrite.wounds;
    }

    get _injuriesWrite() {
        this._fixInjuriesData();
        return this._statsWrite.injuries;
    }

    get _injuriesRead() {
        this._fixInjuriesData();
        return this._statsRead.injuries;
    }

    /**
     * Override
     * @protected
     * @abstract
     */
    _fixInjuriesData() {}
}

class Wounds extends Injurable {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.health.wounds");
    }

    get _statsRead() {
        return this._systemRead.health;
    }

    get _statsWrite() {
        return this._systemWrite.health;
    }

    _fixInjuriesData() {
        // TODO migration
        // Fix for old data structure.
        const read = this._systemRead;
        if (read.wounds != null) {
            const arr = Object.values(read.wounds);
            const length = arr.length;

            this._statsWrite.injuries =  arr.map((injury, idx) => ({detail: injury, tended: idx >= length}));
            this._systemWrite.wounds = null;
        }
    }
}

class Resilience extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.health.resilience");
    }

    get _pointsRead() {
        return this._systemRead.health.resilience;
    }

    get _pointsWrite() {
        return this._systemWrite.health.resilience;
    }

}

class Insanities extends Injurable {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.insanities.max");
    }

    get _statsRead() {
        return this._systemRead.mind;
    }

    get _statsWrite() {
        return this._systemWrite.mind;
    }

    _fixInjuriesData() {
        // TODO migration
        // Fix for old data structure.
        const read = this._systemRead;
        if (read.insanities != null) {
            const arr = Object.values(read.insanities);
            const length = arr.length;

            this._statsWrite.injuries =  arr.map((injury, idx) => ({detail: injury, tended: idx >= length}));
            this._systemWrite.insanities = null;
        }
    }
}

class Psyche extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.psyche.max");
    }

    get _pointsRead() {
        return this._systemRead.mind.psyche;
    }

    get _pointsWrite() {
        return this._systemWrite.mind.psyche;
    }
}

