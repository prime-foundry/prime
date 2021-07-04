import DataManager from "./DataManager.js";
import Controller from "./Controller.js";

class Dyn {
    controller;

    constructor(managed){
        this.controller = new Controller(managed.dynModels);
    }

}
/**
 * @exports PrimeDocument
 * @param {foundry.abstract.Document} FoundrySheetType
 * @returns {module:PrimeDocument~mixin}
 * @constructor
 */
const DynSheetMixin = (FoundrySheetType) =>

    /**
     * @mixin
     * @alias module:PrimeDocument~mixin
     * @extends foundry.abstract.Document
     */
    class extends FoundrySheetType {
        get dyn() {
            if(this._dyn == null) {
                this._dyn = new Dyn(this);
            }
            return this._dyn;
        }

        get dynModels() {
            const models = {sheet:this};
            return models
        }
    };

export default DynSheetMixin