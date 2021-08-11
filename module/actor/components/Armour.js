import {PointsBase} from "./Points.js";
import Component from "../../util/Component.js";
import {PrimeModifierManager} from "../../item/PrimeModifierManager.js";

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
    }

    get max() {
        const armour = PrimeModifierManager.getModifiersByFilteredItems(this._itemPath, this.document, ["shield", "armour"]) || 0;
        const bonus = PrimeModifierManager.getModifiers(this._fullkey, this.document) || 0;
        return armour + bonus;
    }

    /**
     * @returns {number}
     */
    get value() {
        return this.points.value || 0;
    }

    /**
     * @param {number} value
     */
    set value(value) {
        this.write(this.pointsPath.with('value'), Math.max(0, Math.min(this.max, value)));
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
