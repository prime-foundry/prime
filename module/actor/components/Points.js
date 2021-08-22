import Component from "../../util/Component.js";
import {PrimeModifierManager} from "../../item/PrimeModifierManager.js";
import {minmax} from "../../util/support.js";
import {getter, pathGetter, pathProperty} from "../../util/dyn_helpers.js";

/**
 * @abstract
 */
export class PointsBase extends Component {
    constructor(parent) {
        super(parent);
        const pointsPath = this.pointsPath;
        pathProperty(this, 'bonus', pointsPath, {onGet: (bonus) => bonus || 0});
        pathProperty(this, 'value', pointsPath,
            {
                onGet: (value) => minmax(0, value, this.max),
                onSet: (value) => minmax(0, value, this.max)
            }
        );
        pathGetter(this, 'base', pointsPath);
        getter(this, 'max', () => Math.max(this.base + this.bonus, 1), {cached: true});
    }

    get pointsPath() {
    }
}

/**
 * @abstract
 */
export class AwardableBase extends Component {

    constructor(parent) {
        super(parent);
        const pointsPath = this.pointsPath;
        getter(this, 'value', () => this.initial + this.awarded - this.spent, {cached:true});
        pathGetter(this, 'initial', pointsPath, {cached:true});
        pathProperty(this, 'awarded', pointsPath, {cached:true});
        pathGetter(this, 'spent', pointsPath, {cached:true});
    }

    get pointsPath() {
    }
}

export class XP extends AwardableBase {

    constructor(parent) {
        super(parent);
        getter(this, 'spent', () => {
            const refinementCost = this.document.stats.refinements.cost;
            const perkXPCost = PrimeModifierManager.getCostsForType(this.document.items, "xp");
            return refinementCost + perkXPCost;
        }, {cached:true});
    }

    get pointsPath() {
        return this.gameSystemPath.with('xp');
    }
}

export class Soul extends AwardableBase {

    constructor(parent) {
        super(parent);
        getter(this, 'spent', () => {
            const primeCost = this.document.stats.primes.cost;
            const perkSoulCost = PrimeModifierManager.getCostsForType(this.document.items, "soul");
            return primeCost + perkSoulCost;
        }, {cached:true});
        const pointsPath = this.pointsPath;
        pathProperty(this, 'burnt', pointsPath, {onGet:(value) => value || 0});
    }

    get pointsPath() {
        return this.gameSystemPath.with('soul');
    }

    burn() {
        this.burnt = 1 + this.burnt;
    }

}

export class ActionPoints extends PointsBase {
    constructor(parent) {
        super(parent);

        const pointsPath = this.pointsPath;
        getter(this, 'base', ()=>super.base, {onGet:(base) => base || 6});
        getter(this, 'bonus', ()=> PrimeModifierManager.getModifiers("actionPoints.max", this.document), {cached:true});
    }

    get pointsPath() {
        return this.gameSystemPath.with('actionPoints')
    }

}