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
    dyn;

    /**
     * @param {PrimeDocument | Component} parent
     */
    constructor(parent) {
        this.parent = parent;
        this.document = parent instanceof Component ? parent.document : parent;
        this.dyn = this.document.dyn;
    }

    /**
     * The base content of any document, generally it follows a fixed structure, as defined by a schema.
     *
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @returns {typeof foundry.abstract.DocumentData}
     */
    get content(){
        return this.dyn.content;
    }


    /**
     * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {Object}
     */
    get system() {
        return this.dyn.system;
    }

    /**
     * Given a path from document data, and a value set the value at that path point.
     *
     * The base content of any document, generally it follows a fixed structure, as defined by a schema.
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @param path
     * @param value
     * @returns {*} the last value that had been set.
     */
    writeToContent(path, value) {
        return this.dyn.writeToContent(`${path}`, value);
    }

    /**
     * Given a path from system data, and a value set the value at that path point.
     *
     * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {*} the last value that had been set.
     */
    writeToSystem(path, value) {
        return this.dyn.writeToSystem(`${path}`, value);
    }
}