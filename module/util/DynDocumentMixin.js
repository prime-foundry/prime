import DataManager from "./DataManager.js";
import Controller from "./Controller.js";

class Dyn {
    managed;
    dataManager;
    modelName;

    constructor(managed, modelName){
        this.managed = managed;
        this.dataManager = new DataManager(this.managed);
        this.modelName = modelName;
    }

    /**
     * The base content of any document, generally it follows a fixed structure, as defined by a schema.
     *
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @returns {typeof foundry.abstract.DocumentData}
     */
    get content(){
        return this.managed.data;
    }


    /**
     * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {Object}
     */
    get system() {
        return this.content.data;
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
        return this.dataManager.write(`data.${path}`, value);
    }

    /**
     * Given a path from system data, and a value set the value at that path point.
     *
     * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {*} the last value that had been set.
     */
    writeToSystem(path, value) {
        return this.dataManager.write(`data.data.${path}`, value);
    }

}
/**
 * @exports PrimeDocument
 * @param {foundry.abstract.Document} FoundryDocumentType
 * @returns {module:PrimeDocument~mixin}
 * @constructor
 */
const DynDocumentMixin = (FoundryDocumentType, modelName='doc') =>

    /**
     * @mixin
     * @alias module:PrimeDocument~mixin
     * @extends foundry.abstract.Document
     */
    class extends FoundryDocumentType {
        get dyn() {
            if(this._dyn == null) {
                this._dyn = new Dyn(this, modelName);
            }
            return this._dyn;
        }

    };

export default DynDocumentMixin