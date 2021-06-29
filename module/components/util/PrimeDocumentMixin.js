import DataManager from "./DataManager.js";

/**
 * @exports PrimeDocument
 * @param {typeof foundry.abstract.Document} FoundryDocumentType
 * @returns {module:PrimeDocument~mixin}
 * @constructor
 */
const PrimeDocumentMixin = (FoundryDocumentType) =>
    /**
     * @mixin
     * @alias module:PrimeDocument~mixin
     */
    class extends FoundryDocumentType {

        /**
         * Because we are a mixin, we can't do this in the constructor without making ourselves brittle to change.
         * @returns {{manager: DataManager}}
         */
        get prime() {
            if (this._prime == null) {
                const manager = new DataManager(this);
                this._prime = {
                    manager
                };
            }
            return this._prime;
        }
    };

export default PrimeDocumentMixin