import ActorComponent from "./util/ActorComponent.js";
import ItemComponent from "../item/ItemComponent.js";
import {Prime_V1, Refinement_V1} from "./v1/PrimesAndRefinements.v1.js";

class Stat extends ItemComponent {

    constructor(parent, item) {
        super(parent, item);
    }

    get customisable() {
        return !!this._itemSystemData.customisable;
    }

    get default() {
        return !!this._itemSystemData.default;
    }

    get statType() {
        return this._itemSystemData.statType;
    }

    get description() {
        return this._itemSystemData.description;
    }

    get sourceKey() {
        return this._itemSystemData.sourceKey;
    }

    get max() {
        return this._itemSystemData.max;
    }

    get related() {
        return [];
    }

    get value() {
        return this._itemSystemData.value;
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this._itemSystemData.value = value;
            this._update();
        }
    }

    get cost() {
        const num = this.value;
        return (num === 0) ? 0 : ((num * (num + 1)) / 2);
    }
}

class Prime extends Stat {
    constructor(parent, item) {
        super(parent, item);
    }
}

class Refinement extends Stat {
    constructor(parent, item) {
        super(parent, item);
    }
}

class Stats extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    get all() {
        const {physical, mental, supernatural} = this;
        return {physical, mental, supernatural}
    }

    get physical() {
        return this._calculateValueOnce('physical',
            () => this._getTransformedItems().filter(stat => stat.statType === 'physical'));
    }

    get mental() {
        return this._calculateValueOnce('mental',
            () => this._getTransformedItems().filter(stat => stat.statType === 'mental'));
    }

    get supernatural() {
        // version 1 has a spelling mistake.
        if(this._root.version === 1){
            return this._calculateValueOnce('supernatural',
                () => this._getTransformedItems().filter(stat => stat.statType === 'supernaturual'));
        } else {
            return this._calculateValueOnce('supernatural',
                () => this._getTransformedItems().filter(stat => stat.statType === 'supernatural'));
        }
    }

    get cost() {
        return this._calculateValueOnce('cost',
            () => this._getTransformedItems().reduce((accumulator, stat) => accumulator + stat.cost, 0));
    }

    _getTransformedItems() {
        return [];
    }
}

export class Primes extends Stats {

    constructor(parent) {
        super(parent);
    }

    _getTransformedItems() {
        if(this._root.version === 2) {
            return this._calculateValueOnce('getTransformedItems',
                () => this._root._getItemsByType('prime')
                    .sort((one, two) => one.name.localeCompare(two.name))
                    .map(item => new Prime(this, item)));
        } else {
            return this._calculateValueOnce('getTransformedItems',
                () => Object.entries(this._actorSystemData.primes)
                .map(statData => new Prime_V1(this, statData)));
        }
    }
}

export class Refinements extends Stats {
    constructor(parent) {
        super(parent);
    }

    _getTransformedItems() {
        if(this._root.version === 2) {
            return this._calculateValueOnce('getTransformedItems',
                () => this._root._getItemsByType('refinement')
                    .sort((one, two) => one.name.localeCompare(two.name))
                    .map(item => new Refinement(this, item)));
        } else {
            return this._calculateValueOnce('getTransformedItems',
                () => Object.entries(this._actorSystemData.refinements)
                    .map(statData => new Refinement_V1(this, statData)));
        }
    }
}