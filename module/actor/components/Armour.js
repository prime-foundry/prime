import {PointsBase} from "./Points.js";
import Component from "../../util/Component.js";
import {PrimeModifierManager} from "../../item/PrimeModifierManager.js";
import {minmax} from "../../util/support.js";
import {getter} from "../../util/dyn_helpers.js";

export default class Armour extends Component {
    constructor(parent) {
        super(parent);
    }


    /**
     * @return {ArmourPart}
     */
    get resilience() {
        return new ArmourPart(this, 'resilience');
    }

    /**
     * @return {ArmourPart}
     */
    get protection() {
        return new ArmourPart(this, 'protection');
    }

    /**
     * @return {ArmourPart}
     */
    get stability() {
        return new ArmourPart(this, 'stability');
    }

    /**
     * @return {ArmourPart}
     */
    get psyche() {
        return new ArmourPart(this, 'psyche');
    }
}


class ArmourPart extends Component {
    _key;

    constructor(parent, key) {
        super(parent);
        this._key = key;
        this._itemPath = `armour.${key}`;
        this._fullkey = `${this._itemPath}.max`;

        getter(this, 'max', () => {
            const armour = PrimeModifierManager.getModifiersByFilteredItems(this._itemPath, this.document,
                {
                    itemBaseTypes: ["shield", "armour"],
                    filtersData: {equipped: true}
                }) || 0;
            const bonus = PrimeModifierManager.getModifiers(this._fullkey, this.document) || 0;
            return armour + bonus;
        }, {cached:true});
    }

    /**
     * @returns {number}
     */
    get value() {
        return minmax(0, this.points.value, this.max);
    }

    /**
     * @param {number} value
     */
    set value(value) {
        this.write(this.pointsPath.with('value'), minmax(0, value, this.max));
    }

    /**
     * @protected
     */
    get points() {
        return this.gameSystem.armour[this._key] || {};
    }

    get pointsPath() {
        return this.gameSystemPath.with('armour', this._key);
    }
}
