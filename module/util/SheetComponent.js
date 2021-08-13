/**
 * A Component is just a proxy for an existing data store.
 * It doesn't store any real data, just the references to the data store,
 * however it should contain all the modification and utility functions, you might need.
 * Think of it as a cross between an Entity class and a Repository class in Domain Driven Design, (which is a bit like an Object Orientated DAO, or an ORM)
 *
 * This allows us to have clean separation of logical model and physical data store, the data store being a horrible mess.
 * It should also make migration between versions a bit more manageable.
 */
import Component from "./Component.js";

export default class SheetComponent {
    sheet;
    parent;
    document;
    dyn;

    /**
     * @param {PrimeDocument | Component} parent
     */
    constructor(parent) {
        this.parent = parent;
        this.sheet = parent instanceof SheetComponent ? parent.sheet : parent;
        this.document = this.sheet.document
        this.dyn = this.document.dyn;
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