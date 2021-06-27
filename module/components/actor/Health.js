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
class Injurable extends BaseMaxComponent {
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
        return this._injuriesData.filter(injury => !!injury).length
    }

    get injuries() {
        return this._injuriesData.filter(injury => !!injury).map(injury => {
            return {tended: injury.tended, detail: injury.detail}
        })
    }

    get _injuriesData() {
        const data = this._data;
        if (!data.injuries) {
            data.injuries = [];
        }
        return data.injuries;
    }

    sort() {
        // tended first
        // followed by injuries with details, ordered alphabetcally
        const injuries = this._injuriesData
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
        this._data.injuries = injuries;
        this._update();
    }

    getInjury(index) {
        return this._injuriesData[index];
    }

    injure({index, selected: detail}) {
        const oldInjury = this._injuriesData[index];
        if (oldInjury) {
            oldInjury.detail = detail;
        } else {
            this._injuriesData[index] = {detail, tended: false};
        }
        this._update();
    }

    isInjured({index}) {
        return this._injuriesData[index] != null;
    }

    isHealthy({index}) {
        return this._injuriesData[index] == null;
    }

    isTended({index}) {
        const injury = this._injuriesData[index];
        return !!injury && !!injury.tended;
    }

    isUntended({index}) {
        const injury = this._injuriesData[index];
        return !!injury && !injury.tended;
    }

    /**
     * UI function
     * @param index
     * @returns {null|T|number|T|*}
     */
    injuryDetail({index}) {
        const injury = this._injuriesData[Number.parseInt(index)] || {};
        return injury.detail
    }

    aggravate(index) {
        const injury = this._injuriesData[index];
        if (injury && injury.tended) {
            injury.tended = false;
            this._update();
        }
    }


    /**
     * UI Function
     * @param index
     */
    cure({index}) {
        const injury = this._injuriesData[index];
        if (injury) {
            // delete item at index.
            this._injuriesData[index] = null;
            this._update();
            // this.cleanUpData();
        }
    }

    /**
     * UI Function
     * @param activate
     * @param inputPrimeData
     */
    aggravateOrAlleviate({activate, value: index}) {
        const injuriesData = this._injuriesData;
        const injury = injuriesData[index];
        // if we have activated this wound,
        if (activate) {
            // and we have an injury already in this slot
            if (injury) {
                // and the wound is dormant lets aggravate it.
                this.aggravate(index);
            } else {
                // or the wound is not there lets fill with injuries until we have achieved the recommended number of values.
                // if there are no wounds above.
                if (injuriesData.slice(index).filter(injury => !!injury).length === 0) {
                    let count = index - 1;
                    while (count >= 0 && injuriesData[count] == null) {
                        injuriesData[count] = {tended: false, detail: null};
                        count -= 1;
                    }
                }
                injuriesData[index] = {tended: false, detail: null};
                this._update();
            }
            // if we are not activating a wound, and the wound is not tended
        } else if (injury && !injury.tended) {
            // tend the wound
            injury.tended = true;
            // if there are no details on this wound, then lets heal it completely. its a mistake, lets be friendly in our UI
            if ((!injury.detail) || injury.detail == '') {
                injuriesData[index] = null;
            }
            this._update();
        }
    }

}

class Wounds extends Injurable {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.health.wounds");
    }

    get _data() {
        return this._actorSystemData.health.wounds;
    }

    get _injuriesData() {
        const data = this._actorSystemData;
        // Fix for old data structure.
        if (data.wounds != null) {
            const arr = Object.values(data.wounds);
            const length = arr.length;
            data.wounds = arr.forEach((injury, idx) => {
                super._injuriesData.push({detail: injury, tended: idx >= length});
            });
            data.wounds = null;
            this._data.injuries = [];
            this._update();
        }
        return super._injuriesData;
    }
}

class Resilience extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.health.resilience");
    }

    get _data() {
        return this._actorSystemData.health.resilience;
    }
}

class Insanities extends Injurable {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.insanities.max");
    }

    get _data() {
        return this._actorSystemData.mind.insanities;
    }

    get _injuriesData() {
        const data = this._actorSystemData;
        // Fix for old data structure.
        if (data.insanities != null) {
            const arr = Object.values(data.insanities);
            const length = arr.length;
            data.insanities = arr.forEach((injury, idx) => {
                super._injuriesData.push({detail: injury, tended: idx >= length});
            });
            data.insanities = null;
            this._data.injuries = [];
            this._update();
        }
        return super._injuriesData;
    }
}

class Psyche extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return this._actor.getStatBonusesFromItems("mind.psyche.max");
    }

    get _data() {
        return this._actorSystemData.mind.psyche;
    }
}

