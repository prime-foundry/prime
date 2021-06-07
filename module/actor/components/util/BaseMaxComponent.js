import ActorComponent from './ActorComponent.js';

export default class BaseMaxComponent extends ActorComponent{
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
    get bonus(){
        return 0;
    }

    /**
     * To be overriden
     * @return {{value: number, base: number}}
     */
    get _data() {
        return {base:0};
    }
}