import BaseMaxComponent from './BaseMaxComponent.js';

export default class BaseValueMaxComponent extends BaseMaxComponent{
    constructor(parent) {
        super(parent);
    }

    // Really is only a UI concern, we should attach to this.
    get lastTotal() {
        return this._data.lastTotal || 0;
    }
    set lastTotal(value) {
        this._data.lastTotal = value;
        this._update();
    }
    get value() {
        return this._data.value;
    }
    set value(value) {
        this._data.lastTotal = this.value;
        this._data.value = Math.max(0, Math.min( this.max, value));
        this._update();
    }

    _increment(){
        this.value += 1;
    }
    _decrement(){
        this.value -= 1;
    }

    /**
     * To be overriden
     * @return {{value: number, base: number}}
     */
    get _data() {
        return {value:0,base:0};
    }
}