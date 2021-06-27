import {BaseValueMaxComponent} from './util/ActorComponentSupport.js';
import ActorComponent from "./util/ActorComponent.js";

class Awardable extends ActorComponent {

    constructor(parent) {
        super(parent);
    }

    get value() {
        return this.initial + this.awarded - this.spent;
    }
    
    award(value) {
        if (this._actor.isCharacter()) {
            this._pointsWrite.awarded += value;
        }
    }
    
    get initial() {
        if (this._actor.isCharacter()) {
            return this._pointsRead.initial;
        }
        return 0;
    }

    get awarded() {
        if (this._actor.isCharacter()) {
            return this._pointsRead.awarded;
        }
        return 0;
    }

    get spent() {
        if (this._actor.isCharacter()) {
            return this._pointsRead.spent;
        }
        return 0;
    }


    get _pointsRead() {
        return {};
    }
    get _pointsWrite() {
        return {};
    }
}

export class XP extends Awardable {

    constructor(parent) {
        super(parent);
    }
    get _pointsRead() {
        return this._systemRead.xp;
    }

    get _pointsWrite() {
        return this._systemWrite.xp;
    }

    get spent() {
        if (this._actor.isCharacter()) {
            // TODO: totalcost and totalperkcost don't belong in the actor class directly.
            // TODO will not work with V2 chars.
            const refinementCost = this._actor.getTotalCost(this._systemRead.refinements);
            const perkXPCost = this._actor.getTotalPerkCost("perkCostXP");
            return refinementCost + perkXPCost;
        }
        return 0;
    }
}

export class Soul extends Awardable {

    constructor(parent) {
        super(parent);
    }

    get _pointsRead() {
        return this._systemRead.soul;
    }

    get _pointsWrite() {
        return this._systemWrite.soul;
    }

    get value() {
        return super.value - this.burnt;
    }

    get burnt() {
        return this._actor.isCharacter() ? this._pointsRead.burnt || 0 : 0
    }

    burn() {
        this._pointsWrite.burnt = (this._pointsRead.burnt || 0) + 1;
    }

    get spent() {
        if (this._actor.isCharacter()) {
            // TODO: totalcost and totalperkcost don't belong in the actor class directly.
            // TODO will not work with V2 chars.
            const primeCost = this._actor.getTotalCost(this._systemRead.primes);
            const perkSoulCost = this._actor.getTotalPerkCost("perkCostSoul");
            return primeCost + perkSoulCost;
        }
        return 0;
    }
}

export class ActionPoints extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get base() {
        let base = super.base;
        // fix for old sheets
        if (base == null) {
            base = this._pointsRead.base = 6;
        }
        return base;
    }

    get bonus() {
        //TODO: move this out of actor.
        return this._actor.getStatBonusesFromItems("actionPoints");
    }

    get _pointsRead() {
        return this._systemRead.actionPoints;
    }

    get _pointsWrite() {
        return this._systemWrite.actionPoints;
    }
}