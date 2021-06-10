import ActorComponent from './util/ActorComponent.js';
import Health from './Health.js';
import {ActionPoints, XP, Soul} from './Points.js';
import Profile from "./Profile.js";

export default class PrimeActor extends ActorComponent {
    constructor(data) {
        super(data.actor);
        this._dataProvider = data;
    }

    /**
     * @return {Profile}
     */
    get profile() {
        return this._getComponentLazily('profile', Profile);
    }

    /**
     * @return {Health}
     */
    get health() {
        return this._getComponentLazily('health', Health);
    }
    /**
     * @return {ActionPoints}
     */
    get actionPoints() {
        return this._getComponentLazily('actionPoints', ActionPoints);
    }

    /**
     * @return {XP}
     */
    get xp() {
        return this._getComponentLazily('xp', XP);
    }

    /**
     * @return {Soul}
     */
    get soul() {
        return this._getComponentLazily('soul', Soul);
    }

    set actionPoints(value) {
        this.actionPoints.value = value;
    }
}