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

    constructor(actor) {
        this._actor = actor;
    }

    /**
     * Although this navigates up the tree, it only does it once, and persists the root as the parent.
     * @return {ActorComponent}
     */
    get root(){
        if(this._actor instanceof ActorComponent){
            this._actor = this._actor.root;
        } else {
            return this;
        }
    }
    get actor(){
        return this.root._actor;
    }

    get dataProvider(){
        return this.root._dataProvider;
    }

    set dataProvider(dataProvider){
        this.root._dataProvider = dataProvider
        this.reset();
    }

    /**
     * We need one single data object between these changes.
     */
    get actorData() {
        if(this.root._actorData == null){
            if(this.dataProvider == null) {
                this.root._actorData = this.actor.data;
            } else {
                this.root._actorData = this.dataProvider.getData();
            }
        }
        return this.root._actorData;
    }

    get actorDataProperties(){
        return this.actorData.data;
    }

    update() {
        this.dataProvider.markDirty = true;
    }

    reset(){
        this.root._actorData = undefined;
    }
}