import {traversePath} from "./support.js";
import JSONPathBuilder from "./JSONPathBuilder.js";

function fixArrays(viewParts, editParts, viewObj, editObj) {
    viewParts.forEach(({object: viewArray, isArray}, idx) => {
        if (isArray) {
            const {object: editArray} = editParts[idx];
            viewArray.forEach((value, index) => {
                editArray[index] = value;
            });
        }
    });
    if (Array.isArray(viewObj)) {
        viewObj.forEach((value, index) => {
            editObj[index] = value;
        });
    }
}

export default class DataManager {
    document;
    embeddedDataManagers;

    /**
     * @param {foundry.abstract.Document} (document)
     */
    constructor(document) {
        this.document = document;
        this.embeddedDataManagers = new Set();
        this.clear();
    }


    /**
     * Given a path and a value set the value at that path point.
     * as they help to decouple as from the base implementation better.
     *
     * @param {JSONPathBuilder | string[] | string} pathComponents
     * @param {any} value
     * @returns {*}
     */
    write(pathComponents, value, options={getPath:false}) {
        const path = JSONPathBuilder.from(pathComponents).toString();
        if(options.getPath){
            return path;
        }

        const {object: viewObj, property: viewProperty, parts: viewParts} = traversePath(path, this.document, true, true);
        const lastValue = viewObj[viewProperty];

        if (lastValue !== value) {
            viewObj[viewProperty] = value;

            const {object: editObj, property: editProperty, parts: editParts} = traversePath(path, this.editObject, true, true);
            // copy over missing information to the edited array, as foundry can't diff arrays properly.
            fixArrays(viewParts, editParts, viewObj, editObj);
            editObj[editProperty] = value;

            this.dirty = true;
        }
        return lastValue;
    }

    embedDirtyDataManager(embeddedDataManager) {
        this.embeddedDataManagers.add(embeddedDataManager);
    }

    clear() {
        this.dirty = false;
        this.editObject = {data: {}};
        // we don't call clear, because we want to pass the object off,
        // this will help prevent infinite recurssion in the commit method.
        this.embeddedDataManagers = new Set();
    }

    /**
     * Commits any changes that may of occurred.
     * Note: as opposed to the normal foundry update, where render is true, we default it to false instead..
     * If you provide a context object and don't set the render property, it will default it to false for you.
     * This is different to the normal foundry behaviour.
     * @param {DocumentModificationContext} (context)
     */
    async commit(context = {}) {
        const {dirty, editObject, embeddedDataManagers, document} = this;
        this.clear();

        for (const embedded of embeddedDataManagers) {
            embedded.commit(context);
        }
        if (dirty) {
            if (context.render == null) {
                context.render = false;
            }

            await document.update(editObject.data, context);
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
 * @property {boolean} [isUndo]               Is the operation undoing a object operation, only used by embedded Documents within a Scene
 * @property {boolean} [deleteAll]            Whether to delete all documents of a given type, regardless of the array of ids provided. Only used during a delete operation.
 */