import Component from "../../util/Component.js";

/**
 * An ActorComponent is just a proxy for an existing data store.
 * It doesn't store any real data, just the references to the data store,
 * however it should contain all the modification and utility functions, you might need.
 * Think of it as a cross between an Entity class and a Repository class in Domain Driven Design, (which is a bit like an Object Orientated DAO, or an ORM)
 *
 * This allows us to have clean separation of logical model and physical data store, the data store being a horrible mess.
 * It should also make migration between versions a bit more manageable.
 *
 * @example <caption>I want to get the maximum of the the psyche</caption>
 * this.actor.stats.health.psyche.max
 * @example <caption>I want to get the current value.</caption>
 * this.actor.stats.health.psyche.value
 * @example <caption>I want to set the current value.</caption>
 * this.actor.stats.health.psyche.value = 5
 * @example <caption>or, there is a shortcut.</caption>
 * this.actor.stats.health.psyche = 5
 */
export default class ActorComponent extends Component {

    constructor(actor) {
        super(actor);
        this.__actor = this.__isRoot ? actor : actor._actor;
    }

    /**
     * @return {PrimeActor}
     * @protected
     */
    get _root() {
        return super._root;
    }

    /**
     * @return {PrimePCActor}
     * @protected
     */
    get _actor() {
        return this.__actor;
    }

    get _items() {
        return this._actor.items || new Map();
    }

    /**
     * We need one single data object between these changes.
     * @return {ActorData}
     * @protected
     */
    get _actorData() {
        if (this._isRoot) {
            if (this.__actorData == null) {
                if (this.__dataProvider == null) {
                    this.__actorData = this.__actor.data;
                } else {
                    this.__actorData = this.__dataProvider.data;

                }
            }
            return this.__actorData;
        } else {
            return this._root._actorData;
        }
    }

    get _actorSystemData() {
        return this._actorData.data;
    }

    /**
     * @return {User[]}
     * @protected
     */
    get _owners() {
        if (this._isRoot) {
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
        } else {
            return this._root._owners;
        }
    }

    _getItemsByType(type) {
        if (this._isRoot) {
            return this._calculateValueOnce(`items_by_type_${type}`, () => this._items.filter((item) => {
               return type === item.type;
            }));
        } else {
            return this._root._getItemsByType(type);
        }
    }

    _getItemById(id) {
        // JS MAP is fast, no point in saving the value, it will be faster than the property lookup.
        return this._items.get(id);
    }

    _getItemBySourceKey(key) {
        if (this._isRoot) {
            return this._calculateValueOnce(`item_by_sk_${key}`, () => this._items.find((item) => key === item.data.sourceKey));
        } else {
            return this._root._getItemBySourceKey(key);
        }
    }

    /**
     * Is this actor a character
     * @return {boolean}
     */
    _isCharacter() {
        return this._actorData.type === 'character';
    }
}