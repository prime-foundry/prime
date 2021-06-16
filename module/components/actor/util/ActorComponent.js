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

    constructor(parent) {
        super(parent);
    }

    /**
     * @return {PrimeActor}
     * @protected
     */
    get _root() {
        return super._root;
    }


    get _actor() {
        return this._root._actor;
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
        return this._root._actorData;
    }

    get _actorSystemData() {
        return this._actorData.data;
    }

}