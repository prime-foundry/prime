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
export default class ActorComponent {

    constructor(parent) {
        const isRoot = !(parent instanceof ActorComponent);
        this.__isRoot = isRoot;
        this.__actor = isRoot ? parent : parent._actor;
        this.__root = isRoot ? this : parent._root;
    }

    get _root(){
        return this.__root;
    }

    get _dataProvider() {
        return this._root.__dataProvider;
    }

    get _isRoot() {
        return this.__isRoot;
    }

    get _actor() {
        return this.__actor;
    }

    set _dataProvider(dataProvider) {
        if(this._isRoot){
            this.__dataProvider = dataProvider;
        } else {
            this._root._dataProvider = dataProvider;
        }
    }


    /**
     * We need one single data object between these changes.
     */
    get _actorData() {
        if(this._isRoot){
            if (this.__actorData == null) {
                if (this.__dataProvider == null) {
                    this.__actorData = this.__actor.data;
                } else {
                    this.__actorData = this.__dataProvider.data;;
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

    _update() {
        const dataProvider = this._dataProvider;
        if(dataProvider == null){
            this._actor.markedDirty = true;
        } else {
            this._dataProvider.markedDirty = true;
        }
    }
}