import Component from "../util/Component.js";

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
export default class ItemComponent extends Component {

    constructor(parent, item) {
        super(parent);
        this.__item = item;
    }

    /**
     * @return {PrimeItem}
     * @protected
     */
    get _item() {
        return this.__item;
    }

    /**
     * We need one single data object between these changes.
     * @return {ItemData}
     * @protected
     */
    get _itemData() {
        return this._item.data;
    }

    get _itemSystemData() {
        return this._itemData.data;
    }

    get id() {
        return this._item.id;
    }

    get type() {
        return this._item.type;
    }

    get name() {
        return this._item.name;
    }

}