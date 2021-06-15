import ActorComponent from './util/ActorComponent.js';
import Health from './Health.js';
import {ActionPoints, XP, Soul} from './Points.js';
import Profile from "./Profile.js";
import {Primes, Refinements} from "./PrimesAndRefinements.js";

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
     * @return {Primes}
     */
    get primes() {
        return this._getComponentLazily('primes', Primes);
    }

    /**
     * @return {Primes}
     */
    get refinements() {
        return this._getComponentLazily('refinements', Refinements);
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

    get version() {
        if(this._actorSystemData.sheetVersion) {
            switch (this._actorSystemData.sheetVersion) {
                case "v2.0":
                    return 2;
            }
        }
        return 1;
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