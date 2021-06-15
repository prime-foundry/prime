import ActorComponent from "../util/ActorComponent.js";

class Stat_V1 extends ActorComponent {

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
        return this._statData.type;
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

    get value() {
        return this._statData.value;
    }

    get related() {
        return this._statData.related;
    }

    get name() {
        return this._statData.id;
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


    set value(value) {
        if (value <= this.max && value >= 0) {
            this._actorSystemData.primes[this.id] = value;
            this._update();
        }
    }
}

export class Refinement_V1 extends Stat_V1 {
    constructor(parent, statData) {
        super(parent, statData);
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this._actorSystemData.refinements[this.id] = value;
            this._update();
        }
    }
}