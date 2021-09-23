/**
 * A Component is just a proxy for an existing data store.
 * It doesn't store any real data, just the references to the data store,
 * however it should contain all the modification and utility functions, you might need.
 * Think of it as a cross between an Entity class and a Repository class in Domain Driven Design, (which is a bit like an Object Orientated DAO, or an ORM)
 *
 * This allows us to have clean separation of logical model and physical data store, the data store being a horrible mess.
 * It should also make migration between versions a bit more manageable.
 *
 * A component is always tied to a single document, where it will make the changes.
 */
import {DynError} from "./support.js";

export default class Component {
    parent;
    rootComponent;

    /**
     * @param {foundry.abstract.Document | Component | DocumentSheet | {document: foundry.abstract.Document}} parent
     */
    constructor(parent) {
        this.parent = parent;

        let getter;
        if(parent instanceof Component){
            this.rootComponent = parent.rootComponent;
            // get document on root
            getter =  () => this.rootComponent.document;
        } else if(parent instanceof foundry.abstract.Document){
            this.rootComponent = this;
            // get document on self
            getter =  () => this.parent;
        } else if(parent.document !== undefined){
            this.rootComponent = this;
            // get document on parent
            getter =  () => this.parent.document;
        } else {
            throw new DynError("parent must either be a Document, or provide a 'document' getter/value for a Document");
        }
        Object.defineProperty(this, 'document', {enumerable:true, get:getter});
    }

    get dyn(){
        return this.document.dyn;
    }

    /**
     * The base foundryData of any document, generally it follows a fixed structure, as defined by a schema.
     *
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @returns {foundry.abstract.DocumentData | {data}}
     */
    get foundryData(){
        return this.dyn.foundryData;
    }

    /**
     * gameSystem data is the freeform add whatever you want to data, it is generally based on the template set for the gameSystem.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {Object}
     */
    get gameSystem() {
        return this.dyn.gameSystem;
    }


    /**
     *
     * @param {JSONPathBuilder | string[] | string} pathComponents
     * @param {any} value
     * @returns {*}
     */
    write(pathComponents, value){
        return this.dyn.write(pathComponents,value);
    }

    /**
     * Given a path from document data, and a value set the value at that path point.
     *
     * The base foundryData of any document, generally it follows a fixed structure, as defined by a schema.
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @param path
     * @param value
     * @returns {*} the last value that had been set.
     */
    get foundryDataPath(){
        return this.dyn.foundryDataPath;
    }

    /**
     * Given a path from gameSystem data, and a value set the value at that path point.
     *
     * gameSystem data is the freeform add whatever you want to data, it is generally based on the template set for the gameSystem.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {*} the last value that had been set.
     */
    get gameSystemPath(){
        return this.dyn.gameSystemPath;
    }
}