import ActorComponent from './ActorComponent.js';

export default class BaseValueMaxComponent extends ActorComponent{
    constructor(actor) {
        super(actor);
    }
    get base() {
        return this.getData().base;
    }
    get max() {
        return this.base + this.getStatBonuses();
    }
    get value() {
        return this.getData().value;
    }
    set value(value) {
        this.getData().value = Math.min(0, Math.max( this.max, value));
        this.update();
    }

    increment(){
        this.value += 1;
    }
    decrement(){
        this.value -= 1;
    }
    /**
     * To be optionally overriden
     * @return {{value: number, base: number}}
     */
    getStatBonuses(){
        return 0;
    }

    /**
     * To be overriden
     * @return {{value: number, base: number}}
     */
    getData() {
        return {value:0,base:0};
    }
}