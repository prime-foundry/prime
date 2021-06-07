import ActorComponent from './util/ActorComponent.js';
import Health from './Health.js';
import ActionPoints from './ActionPoints.js';
export default class Stats extends ActorComponent{
    constructor(parent) {
        super(parent);
    }

    get health() {
        if(!this._health){
            this._health = new Health(this);
        }
        return this._health;
    }

    get actionPoints() {
        if(!this._actionPoints){
            this._actionPoints = new ActionPoints(this);
        }
        return this._actionPoints;
    }

    set actionPoints(value) {
        this.actionPoints.value = value;
    }
}