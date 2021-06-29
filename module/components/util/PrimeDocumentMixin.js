import DataManager from "./DataManager.js";

/**
 * @exports PrimeDocument
 * @param {foundry.abstract.Document} FoundryDocumentType
 * @returns {module:PrimeDocument~mixin}
 * @constructor
 */
const PrimeDocumentMixin = (FoundryDocumentType) =>

    /**
     * @mixin
     * @alias module:PrimeDocument~mixin
     * @extends foundry.abstract.Document
     */
    class extends FoundryDocumentType {

        /**
         * Because we are a mixin, we can't do this in the constructor without making ourselves brittle to change.
         * @returns {DataManager}
         */
        get dataManager() {
            if (this._dataManager == null) {
                this._dataManager = new DataManager(this);
            }
            return this._dataManager;
        }

        /**
         * The base content of any document, generally it follows a fixed structure, as defined by a schema.
         *
         * @see foundry.abstract.DocumentData.defineSchema()
         * @see ActorData.defineSchema()
         * @returns {typeof foundry.abstract.DocumentData}
         */
        get content(){
            return this.data;
        }


        /**
         * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
         * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
         * @returns {Object}
         */
        get system() {
            return this._dataManager.data;
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
            return this._dataManager.write(`data.${path}`, value);
        }

        /**
         * Given a path from system data, and a value set the value at that path point.
         *
         * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
         * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
         * @returns {*} the last value that had been set.
         */
        writeToSystem(path, value) {
            return this._dataManager.write(`data.data.${path}`, value);
        }
    };

export default PrimeDocumentMixin