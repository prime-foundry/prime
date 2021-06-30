import {getComponentLazily} from "../../util/support.js";
import {PointsBase} from "./Points.js";
import Component from "../../util/Component.js";

export default class Health extends Component {
    constructor(parent) {
        super(parent);
    }

    /**
     * @return {Wounds}
     */
    get wounds() {
        return getComponentLazily(this, 'wounds', Wounds);
    }

    set wounds(value) {
        this.wounds.value = value;
    }

    /**
     * @return {Resilience}
     */
    get resilience() {
        return getComponentLazily(this, 'resilience', Resilience);
    }

    set resilience(value) {
        this.resilience.value = value;
    }

    /**
     * @return {Insanities}
     */
    get insanities() {
        return getComponentLazily(this, 'insanities', Insanities);
    }

    set insanities(value) {
        this.insanities.value = value;
    }

    /**
     * @return {Psyche}
     */
    get psyche() {
        return getComponentLazily(this, 'psyche', Psyche);
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
class InjurableBase extends PointsBase {

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
        return this.injuries.filter(injury => !!injury).length
    }

    sort() {
        // tended first
        // followed by injuries with details, ordered alphabetcally
        const injuries = this.injuries
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
        this.overwriteInjuries(injuries);
    }

    getInjury(index) {
        return this.injuries[index];
    }

    injure({index, selected: detail}) {
        const oldInjury = this.injuries[index];
        if (oldInjury) {
            this.writeToInjury(index, 'detail', detail);
        } else {
            this.overwriteInjury(index, {detail, tended: false});
        }
    }

    isInjured({index}) {
        return this.injuries[index] != null;
    }

    isHealthy({index}) {
        return this.injuries[index] == null;
    }

    isTended({index}) {
        const injury = this.injuries[index];
        return !!injury && !!injury.tended;
    }

    isUntended({index}) {
        const injury = this.injuries[index];
        return !!injury && !injury.tended;
    }

    /**
     * UI function
     * @param index
     * @returns {null|T|number|T|*}
     */
    injuryDetail({index}) {
        const injury = this.injuries[Number.parseInt(index)] || {};
        return injury.detail
    }

    aggravate(index) {
        const injury = this.injuries[index];
        if (injury && injury.tended) {
            this.writeToInjury(index, 'tended', false);
        }
    }


    /**
     * UI Function
     * @param index
     */
    cure({index}) {
        const injury = this.injuries[index];
        if (injury) {
            this.overwriteInjury(index, null);
        }
    }

    /**
     * UI Function
     * @param activate
     * @param inputPrimeData
     */
    aggravateOrAlleviate({activate, value: index}) {
        const injury = this.injuries[index];
        // if we have activated this wound,
        if (activate) {
            // and we have an injury already in this slot
            if (injury) {
                // and the wound is dormant lets aggravate it.
                this.aggravate(index);
            } else {
                // or the wound is not there lets fill with injuries until we have achieved the recommended number of values.
                // if there are no wounds above.
                if (this.injuries.slice(index).filter(injury => !!injury).length === 0) {
                    let count = index - 1;
                    while (count >= 0 && this.injuries[count] == null) {
                        this.overwriteInjury(count, {tended: false, detail: null})
                        count -= 1;
                    }
                }
                this.overwriteInjury(index, {tended: false, detail: null})
            }
            // if we are not activating a wound, and the wound is not tended
        } else if (injury && !injury.tended) {
            // tend the wound
            this.writeToInjury(index, 'tended', true)
            // if there are no details on this wound, then lets heal it completely. its a mistake, lets be friendly in our UI
            if ((!injury.detail) || injury.detail == '') {
                this.overwriteInjury(index, null)
            }
        }
    }


    /**
     * @protected
     */
    get points() {
        return this.stats.wounds;
    }


    /**
     * @protected
     */
    writeToPoints(parameterName, value) {
        return this.writeToStats(`wounds.${parameterName}`, value)
    }


    /**
     * @protected
     */
    get injuries(){
        this._fixInjuriesData();
        return this.stats.injuries;
    }

    /**
     * @protected
     */
    writeToInjuries(parameterName, value) {
        this._fixInjuriesData();
        return this.writeToStats(`injuries.${parameterName}`, value)
    }

    /**
     * @protected
     */
    writeToInjury(index, parameterName, value) {
        return this.writeToInjuries(`${index}.${parameterName}`, value)
    }

    /**
     * @protected
     */
    overwriteInjuries(injuries) {
        this._fixInjuriesData();
        return this.writeToStats(`injuries`, injuries)
    }
    /**
     * @protected
     */
    overwriteInjury(index, injury) {
        return this.writeToInjuries(`${index}`, injury)
    }
    /**
     * Override
     * @protected
     * @abstract
     */
    get stats() {

    }

    /**
     * Override
     * @protected
     * @abstract
     */
    writeToStats(parameterPath, value) {};

    /**
     * Override
     * @protected
     * @abstract
     */
    _fixInjuriesData() {}
}

class Wounds extends InjurableBase {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        // TODO Move
        return this.document.getStatBonusesFromItems("mind.health.wounds");
    }

    get stats() {
        return this.system.health;
    }

    /**
     * @protected
     */
    writeToStats(parameterPath, value) {
        return this.writeToSystem(`health.${parameterPath}`, value);
    };

    /**
     * @protected
     */
    _fixInjuriesData() {
        // TODO migration
        // Fix for old data structure.
        if (this.stats.wounds != null) {
            const arr = Object.values(this.stats.wounds);
            const length = arr.length;
            const injuries = arr.map((injury, idx) => ({detail: injury, tended: idx >= length}));
            this.writeToStats('injuries', injuries);
            this.writeToSystem('wounds', null);
        }
    }
}

class Resilience extends PointsBase {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        // TODO Move
        return this._actor.getStatBonusesFromItems("mind.health.resilience");
    }

    /**
     * @protected
     */
    get points() {
        return this.system.health.resilience;
    }

    /**
     * @protected
     */
    writeToPoints(parameterName, value) {
        return this.writeToSystem(`health.resilience.${parameterName}`, value)
    }
}

class Insanities extends InjurableBase {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        // TODO Move
        return this.document.getStatBonusesFromItems("mind.insanities.max");
    }

    /**
     * @protected
     */
    get stats() {
        return this.system.mind;
    }

    /**
     * @protected
     */
    writeToStats(parameterPath, value) {
        return this.writeToSystem(`mind.${parameterPath}`, value);
    };

    /**
     * @protected
     */
    _fixInjuriesData() {
        // TODO migration
        // Fix for old data structure.
        if (this.stats.insanities != null) {
            const arr = Object.values(this.stats.insanities);
            const length = arr.length;
            const injuries = arr.map((injury, idx) => ({detail: injury, tended: idx >= length}));
            this.writeToStats('injuries', injuries);
            this.writeToSystem('insanities', null);
        }
    }
}

class Psyche extends PointsBase {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        // TODO Move
        return this.document.getStatBonusesFromItems("mind.psyche.max");
    }

    /**
     * @protected
     */
    get points() {
        return this.system.mind.psyche;
    }

    /**
     * @protected
     */
    writeToPoints(parameterName, value) {
        return this.writeToSystem(`mind.psyche.${parameterName}`, value)
    }
}

