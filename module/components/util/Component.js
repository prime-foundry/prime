/**
 * A Component is just a proxy for an existing data store.
 * It doesn't store any real data, just the references to the data store,
 * however it should contain all the modification and utility functions, you might need.
 * Think of it as a cross between an Entity class and a Repository class in Domain Driven Design, (which is a bit like an Object Orientated DAO, or an ORM)
 *
 * This allows us to have clean separation of logical model and physical data store, the data store being a horrible mess.
 * It should also make migration between versions a bit more manageable.
 */
export default class Component {
    parent;
    document;

    /**
     * @param {PrimeDocument | Component} parent
     */
    constructor(parent) {
        this.parent = parent;
        this.document = parent instanceof Component ? parent.document : parent;
    }

    /**
     * The write and the read maybe changed, so we don't store the editor directly, we simply reference it.
     * @returns {DataManager}
     * @protected
     */
    get manager() {
        return this.document.prime.manager;
    }

    get read(){
        return this.manager.data;
    }

    write(path, value) {
        return this.manager.write(path, value);
    }

}