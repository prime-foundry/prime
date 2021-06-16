import ActorComponent from './ActorComponent.js';

export class MapLikeComponent extends ActorComponent {
    constructor(parent) {
        super(parent);
        this._prepareMapLikeComponent();
    }

    /**
     * Takes all the provided keys, and creates properties on the object, with its own getters and setters.
     * Useful for non static lists such as primes and refinements
     * @private
     */
    _prepareMapLikeComponent() {
        const keys = this._getKeys();
        const obj = this;
        keys.map((item) => {
            let key = item;
            let config = undefined;
            if (Array.isArray(item)) {
                [key, config] = item;
            }
            const property = {
                // enumerable: true,
                get:() => obj._getValueForKey(key, config),
                set:(value) => obj._setValueForKey(key, value, config),
            };
            return [key, property];
        }).forEach(([key,property]) => {
            Object.defineProperty(obj, key, property)
        });
    }

    /**
     * @abstract
     * @protected
     */
    _getKeys() {
        return [];
    }

    /**
     * @abstract
     * @protected
     */
    _getValueForKey(key) {
        return undefined;
    }

    /**
     * @abstract
     * @protected
     */
    _setValueForKey(key, value) {
    }
}

export class BaseMaxComponent extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    get base() {
        return this._data.base;
    }

    get max() {
        return this.base + this.bonus;
    }

    /**
     * To be optionally overriden
     * @return {{value: number, base: number}}
     */
    get bonus() {
        return 0;
    }

    /**
     * To be overriden
     * @return {{value: number, base: number}}
     */
    get _data() {
        return {base: 0};
    }
}

export class BaseValueMaxComponent extends BaseMaxComponent {
    constructor(parent) {
        super(parent);
    }

    // Really is only a UI concern, we should attach to this.
    get lastTotal() {
        const lastTotal = this._data.lastTotal || 0;
        return lastTotal;
    }

    set lastTotal(value) {
        this._data.lastTotal = value;
        this._update();
    }

    get value() {
        return this._data.value;
    }

    set value(value) {
        this.lastTotal = this.value;
        this._data.value = Math.max(0, Math.min(this.max, value));
        this._update();
    }

    /**
     * To be overriden
     * @return {{value: number, base: number}}
     */
    get _data() {
        return {value: 0, base: 0};
    }
}