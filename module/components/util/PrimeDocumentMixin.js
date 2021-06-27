import DataEditor from "./DataEditor.js";

/**
 * @param {typeof foundry.abstract.Document} FoundryDocumentType
 * @returns {typeof PrimeDocument}
 * @constructor
 */
export default function PrimeDocumentMixin( FoundryDocumentType )  {
    /**
     * @typedef PrimeDocument
     * @extends {foundry.abstract.Document}
     * @property {PrimeDocumentPrime} prime
     */
    return class extends FoundryDocumentType {

        /**
         * @typedef PrimeDocumentPrime
         * @property {DataEditor} editor
         */
        /**
         * Because we are a mixin, we can't do this in the constructor without making ourselves brittle to change.
         * @returns {*|{editor: DataEditor}}
         */
        get prime() {
            if(this._prime == null){
                const editor = new DataEditor(this);
                this._prime = {
                    editor
                }
            }
            return this._prime;
        }
    }
}