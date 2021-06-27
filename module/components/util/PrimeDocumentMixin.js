import DataEditor from "./DataEditor.js";

/**
 * @param {typeof foundry.abstract.Document} FoundryDocumentType
 * @returns {typeof foundry.abstract.Document}
 * @constructor
 */
export default function PrimeDocumentMixin( FoundryDocumentType )  {
    return class extends FoundryDocumentType {

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

        get _primeDocumentMixin() {
            return true;
        }
    }
}