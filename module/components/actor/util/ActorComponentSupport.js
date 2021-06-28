import ActorComponent from './ActorComponent.js';

export class BaseMaxComponent extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    /**
     * @returns {number}
     */
    get base() {
        return this._pointsRead.base;
    }

    /**
     * @returns {number}
     */
    get max() {
        return this.base + this.bonus;
    }

    /**
     * To be optionally overriden
     * @return {number}
     */
    get bonus() {
        return 0;
    }

    /**
     * To be overriden
     * @interface
     * @return {{ base: number}}
     */
    get _pointsRead() {
        return {base: 0};
    }
    /**
     * To be overriden
     * @interface
     * @return {{base: number}}
     */
    get _pointsWrite() {
        return {base: 0};
    }
}

export class BaseValueMaxComponent extends BaseMaxComponent {
    constructor(parent) {
        super(parent);
    }

    // Really is only a UI concern, we should attach to this.
    /**
     * @returns {number}
     */
    get lastTotal() {
        const lastTotal = this._pointsRead.lastTotal || 0;
        return lastTotal;
    }

    /**
     * @param {number} value
     */
    set lastTotal(value) {
        this._pointsWrite.lastTotal = value;
    }

    /**
     * @returns {number}
     */
    get value() {
        return this._pointsRead.value;
    }

    /**
     * @param {number} value
     */
    set value(value) {
        this.lastTotal = this.value;
        this._pointsWrite.value = Math.max(0, Math.min(this.max, value));
    }

    /**
     * To be overriden
     * @interface
     * @return {{value: number, base: number}}
     */
    get _pointsRead() {
        return {value: 0,base: 0};
    }

    /**
     * To be overriden
     * @interface
     * @return {{value: number, base: number}}
     */
    get _pointsWrite() {
        return {value: 0,base: 0};
    }
}