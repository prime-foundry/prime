import Health from './Health.js';
import {ActionPoints, XP, Soul} from './Points.js';
import Profile from "./Profile.js";
import Stats from "./Stats.js";
import ParentComponent from "../util/ParentComponent.js";

export default class PrimeActor extends ParentComponent {
    constructor(actor, controller) {
        super(actor, controller);
    }

    /**
     * @return {Profile}
     */
    get profile() {
        return this._getComponentLazily('profile', Profile);
    }
    /**
     * @return {Stats}
     */
    get stats(){
        return this._getComponentLazily('stats', Stats);
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


    /**
     * @returns {PrimePCActor}
     */
    get _actor() {
        return super._document;
    }

    get _actorData() {
        if (this.__actorData == null) {
            if (this._controller && this._controller._sheet && this._controller._sheetData) {
                this.__actorData = this._controller._sheetData.data;
            } else {
                this.__actorData = this.__actor.data;
            }
        }
        return this.__actorData;
    }
    get _actorSystemData() {
        return this._actorData.data;
    }
    /**
     * @return {User[]}
     * @protected
     */
    get _owners() {
        return this._calculateValueOnce('owners', () =>
            Object.entries(this._actorData.permission || {})
                .filter(([key, permission]) => {
                    return key != 'default' && permission == 3;
                })
                .map(([key,]) => {
                    return game.users.get(key);
                })
                .filter((user) => !!user && !user.isGM)
        );
    }

    get _items() {
        return this._actor.items || new Map();
    }

    _getItemsByType(type) {
        return this._calculateValueOnce(`items_by_type_${type}`, () => this._items.filter((item) => {
            return type === item.type;
        }));
    }

    _getItemBySourceKey(key) {
        return this._calculateValueOnce(`item_by_sk_${key}`, () => this._items.find((item) => key === item.data.sourceKey));
    }
    /**
     * Is this actor a character
     * @return {boolean}
     */
    _isCharacter() {
        return this._actorData.type === 'character';
    }
}