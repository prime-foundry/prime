import Component from "../../../util/Component.js";

// TODO: Migrate: version 1 managements of stats, moved to a separate file, for easy removal once migrated..
class Stat_V1 extends Component {

    constructor(parent, statData) {
        super(parent);
        this.__id = statData[0];
        this.__statData = statData[1];
    }

    get _statData() {
        return this.__statData;
    }

    get customisable() {
        return false;
    }

    get default() {
        return true;
    }

    get statType() {
        const statType = this._statData.type;
        // V1 has a spelling mistake.
        if(statType === 'supernaturual'){
            return 'supernatural'
        }
        return statType;
    }

    get description() {
        return this._statData.description;
    }

    get sourceKey() {
        return undefined;
    }

    get max() {
        return this._statData.max;
    }

    get related() {
        return this._statData.related;
    }

    get title() {
        return game.i18n.localize(this._statData.title);
    }

    get id() {
        return this.__id;
    }

    get cost() {
        const num = this.value;
        return (num === 0) ? 0 : (num * (num + 1)) / 2;
    }
}

export class Prime_V1 extends Stat_V1 {
    constructor(parent, statData) {
        super(parent, statData);
    }

    get value() {
        return this._statData.value;
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this.writeToPrimes(this.id, value);
        }
    }

    writeToPrimes(id, value) {
        this.writeToSystem(`primes.${id}.value`, value)
    }
}

export class Refinement_V1 extends Stat_V1 {
    constructor(parent, statData) {
        super(parent, statData);
    }

    get value() {
        return this._statData.value;
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this.writeT0Refinements(this.id, value);
        }
    }
    writeT0Refinements(id, value) {
        this.writeToSystem(`refinements.${id}.value`, value)
    }
}