import Util from "./Util.js";

export default class DataManager {
    document;

    /**
     * @param {foundry.abstract.Document} (document)
     */
    constructor(document) {
        this.document = document;
        this.clear();
    }

    /**
     * @returns {(foundry.abstract.DocumentData)}
     */
    get data(){
        return this.document.data;
    }

    get systemData() {
        return this.data.data;
    }

    dataPath(){
        return 'data';
    }

    systemDataPath(){
        return 'data.data';
    }

    write(path, value){
        // write to the read.
        const lastValue = Util.traverseAndSet(path, this, value);
        if(lastValue !== value){
            // write to the write
            Util.traverseAndSet(path, this.editObject, value);
            this.dirty = true;
        }
        return lastValue;
    }

    clear() {
        this.dirty = false;
        this.editObject = {data:{}};
    }

    /**
     * Commits any changes that may of occurred.
     * Note: as opposed to the normal foundry update, where render is true, we default it to false instead..
     * If you provide a context object and don't set the render property, it will default it to false for you.
     * This is different to the normal foundry behaviour.
     * @param {DocumentModificationContext} (context)
     */
    async commit(context = {}) {
        if(this.dirty){
            if(context.render == null){
                context.render = false;
            }
            const editObject = this.editObject;
            await this.document.update(editObject, context);
            this.clear();
        }
    }

}

/**
 * Copied from foundry document.mjs, and so may change on updates
 * @version 0.8.8
 * @ignore
 *
 * @typedef {Object} DocumentModificationContext
 * @property {Document} [parent]              A parent Document within which these Documents should be embedded
 * @property {string} [pack]                  A Compendium pack identifier within which the Documents should be modified
 * @property {boolean} [noHook=false]         Block the dispatch of preCreate hooks for this operation
 * @property {boolean} [index=false]          Return an index of the Document collection, used only during a get operation.
 * @property {string[]} [indexFields]         An array of fields to retrieve when indexing the collection
 * @property {boolean} [keepId=false]         When performing a creation operation, keep the provided _id instead of clearing it.
 * @property {boolean} [temporary=false]      Create a temporary document which is not saved to the database. Only used during creation.
 * @property {boolean} [render=false]          Automatically re-render existing applications associated with the document.
 *  The original default context object normally specifies this as true, but in the case, we are removing the constant re-rendering.
 * @property {boolean} [renderSheet=false]    Automatically create and render the Document sheet when the Document is first created.
 * @property {boolean} [diff=true]            Difference each update object against current Document data to reduce the size of the transferred data. Only used during update.
 * @property {boolean} [recursive=true]       Merge objects recursively. If false, inner objects will be replaced explicitly. Use with caution!
 * @property {boolean} [isUndo]               Is the operation undoing a previous operation, only used by embedded Documents within a Scene
 * @property {boolean} [deleteAll]            Whether to delete all documents of a given type, regardless of the array of ids provided. Only used during a delete operation.
 */