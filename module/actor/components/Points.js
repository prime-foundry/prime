import Component from "../../util/Component.js";
import {PrimeModifierManager} from "../../item/PrimeModifierManager.js";

/**
 * @abstract
 */
export class PointsBase extends Component {
    constructor(parent) {
        super(parent);
    }

    /**
     * @returns {number}
     */
    get base() {
        return this.points.base;
    }

    /**
     * @returns {number}
     */
    get max() {
        return Math.max(this.base + this.bonus,1);
    }

    /**
     * To be optionally overriden
     * @return {number}
     */
    get bonus() {
        return this.points.bonus || 0;
    }

    /**
     * @returns {number}
     */
    get value() {
        return Math.max(Math.min(this.max, this.points.value || 0),0);
    }

    /**
     * @param {number} value
     */
    set value(value) {
        this.writeToPoints(Math.max(0, Math.min(this.max, value)), 'value');
    }

    /**
     * To be overriden
     * @interface
     * @return {{value: number, base: number}}
     */
    get points() {
        return {value: 0,base: 0};
    }

    /**
     * To be overriden
     * @interface
     */
    writeToPoints(value, ...pathComponents) {
        this.write(this.pointsPath.with(...pathComponents), value);
    }

    get pointsPath() { }
}

/**
 * @abstract
 */
export class AwardableBase extends Component {

    constructor(parent) {
        super(parent);
    }

    get value() {
        return this.initial + this.awarded - this.spent;
    }
    
    get initial() {
        if (this.document.isCharacter()) {
            return this.points.initial;
        }
        return 0;
    }

    get awarded() {
        if (this.document.isCharacter()) {
            return this.points.awarded;
        }
        return 0;
    }

    get spent() {
        if (this.document.isCharacter()) {
            return this.points.spent;
        }
        return 0;
    }

    award(value) {
        if (this.document.isCharacter()) {
            this.writeToPoints(this.points.awarded + value, 'awarded');
        }
    }

    /**
     * @interface
     * @returns {{initial: number, awarded: number, spent: number}}
     */
    get points() {
        return {initial:0, awarded:0, spent:0};
    }

    /**
     * To be overriden
     * @interface
     */
    writeToPoints(value, ...pathComponents) {
        this.write(this.pointsPath.with(...pathComponents), value);
    }

    get pointsPath() { }
}

export class XP extends AwardableBase {

    constructor(parent) {
        super(parent);
    }

    /**
     * @interface
     * @returns {{initial: number, awarded: number}}
     */
    get points() {
        return this.gameSystem.xp;
    }

    get pointsPath() {
        return this.gameSystemPath.with('xp');
    }

    get spent() {
        if (this.document.isCharacter()) {
            // TODO: totalcost and totalperkcost don't belong in the actor class directly.
            // TODO will not work with V2 chars.
            const refinementCost = this.document.stats.refinements.cost;
            const perkXPCost = PrimeModifierManager.getCostsForType(this.document.items,"xp");
            return refinementCost + perkXPCost;
        }
        return 0;
    }
}

export class Soul extends AwardableBase {

    constructor(parent) {
        super(parent);
    }

    /**
     * @interface
     * @returns {{initial: number, awarded: number}}
     */
    get points() {
        return this.gameSystem.soul;
    }

    get pointsPath() {
        return this.gameSystemPath.with('soul');
    }

    get value() {
        return super.value - this.burnt;
    }

    get burnt() {
        return this.document.isCharacter() ? this.points.burnt || 0 : 0
    }

    burn() {
        this.writeToPoints(this.burnt + 1, 'burnt');
    }

    get spent() {
        if (this.document.isCharacter()) {
            // TODO: totalcost and totalperkcost don't belong in the actor class directly.
            // TODO will not work with V2 chars.
            const primeCost = this.document.stats.primes.cost;
            const perkSoulCost = PrimeModifierManager.getCostsForType(this.document.items, "soul");
            return primeCost + perkSoulCost;
        }
        return 0;
    }
}

export class ActionPoints extends PointsBase {
    constructor(parent) {
        super(parent);
    }

    get base() {
        let base = super.base;
        // fix for old sheets
        if (base == null) {
            base = 6;
            this.writeToPoints(base, 'base');
        }
        return base;
    }

    get bonus() {
        return PrimeModifierManager.getModifiers("actionPoints.max", this.document);
    }


    get points() {
        return this.gameSystem.actionPoints;
    }

    get pointsPath() {
        return this.gameSystemPath.with('actionPoints')
    }

}