import DataEditor from "./DataEditor.js";

/**
 * @param {typeof foundry.abstract.Document} FoundryDocumentType
 * @returns {class}
 * @constructor
 */
export default function PrimeDocumentMixin( FoundryDocumentType )  {
    return class extends FoundryDocumentType {
        /**
         * Because we are a mixin, we can't do this in the constructor without making ourselves britle to change.
         * @returns {*|{editor: DataEditor}}
         */
        get prime() {
            if(this._prime == null){
                this._prime = {
                    editor: new DataEditor(this)
                };
            }
            return this._prime;
        }
    }
}