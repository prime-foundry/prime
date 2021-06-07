import ActorComponent from './util/ActorComponent.js';
import Stats from "./Stats.js";

export default class PrimeCharacter extends ActorComponent {
    constructor(data) {
        super(data.actor);
        this._dataProvider = data;
    }

    get stats() {
        if(!this._stats){
            this._stats = new Stats(this);
        }
        return this._stats;
    }
}