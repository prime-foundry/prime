
class PartialsEditor {
    constructor(parent, propertyName) {
        this.parent = parent;
        this.propertyName = propertyName;
        this.editors = new Map();
    }
    /**
     * We are intercepting any get calls, and creating a proxy editor object for that value.
     * We need to do this, as we may be traversing the object graph, before setting a value.
     *
     * @param target The target object.
     * @param prop The name or Symbol of the property to get
     * @returns {any}
     */
    get(target, prop) {
       const value = Reflect.get(...arguments);
       if(value != null && !this.editors.has(prop)){
           this.editors.set(prop, Proxy.revocable(value, new PartialsEditor(this, prop)));
       }
       return value;
    }

    /**
     * @param target - The target object
     * @param prop - The name or Symbol of the property to set.
     * @param value - The new value of the property to set.
     * @returns {boolean}
     */
    set(target, prop, value) {
        if(this.editors.has(prop)){
            const oldProxy = this.editors.get(prop);
            oldProxy.revoke();
            if(value != null) {
                this.editors.set(prop, Proxy.revocable(value, new PartialsEditor(this, prop)));
            } else {
                this.editors.delete(prop);
            }
        }
        if(Reflect.set(...arguments)){
            this.getEditableObject(true)[prop] = value;
            return true;
        }
        return false;
    }

    /**
     * returns the editiable object, we also double utitlise this method to optionally mark the context dirty,
     * this is generally because its multiple steps up and down.
     * @param markdirty
     * @returns {{}|*}
     */
    getEditableObject(markdirty = false) {
        const parentObject = this.parent.getEditableObject(markdirty);
        const thisObject = parentObject[this.propertyName];
        if(thisObject == null){
            return parentObject[this.propertyName] = {};
        }
        return thisObject;
    }
}

/**
 * We use Javascript proxies to intercept any getter or setters that happen all the way up the call chain.
 * By mirroring, the data structures, with a proxy chain, we can effectively create partial data changes.
 */
export default class DataEditor {
    constructor(document) {
        const data = document.data;
        this.document = document;
        this.read = data;
        this.resetEditor(data);
        this.clearChanges();
    }

    resetEditor(data){
        if(this.write != null && data != null){
            this.write.revoke()
            this._editor_handler = new PartialsEditor(this, 'data')
            this.write = Proxy.revocable(data, this._editor_handler);
        }
    }

    clear(){
        this.changeData = null;
    }

    /**
     * @param {DocumentModificationContext} (context)
     */
    commit(context = {}) {
        // get the object we create for partially updating.
        if(this.dirty && this.changes != null){
            this.dirty = false;
            const changes = this.changes.data;
            this.clearChanges();
            this.document.update(changes, context)
        }
    }

    /**
     * @protected
     * @param markdirty
     * @returns {*|{}}
     */
    getEditableObject(markdirty = false) {
        if(markdirty){
            this.dirty = true;
        }
        if(this.changes == null){
            this.changes = {};
        }
        return this.changes;
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
 * @property {boolean} [render=true]          Automatically re-render existing applications associated with the document.
 * @property {boolean} [renderSheet=false]    Automatically create and render the Document sheet when the Document is first created.
 * @property {boolean} [diff=true]            Difference each update object against current Document data to reduce the size of the transferred data. Only used during update.
 * @property {boolean} [recursive=true]       Merge objects recursively. If false, inner objects will be replaced explicitly. Use with caution!
 * @property {boolean} [isUndo]               Is the operation undoing a previous operation, only used by embedded Documents within a Scene
 * @property {boolean} [deleteAll]            Whether to delete all documents of a given type, regardless of the array of ids provided. Only used during a delete operation.
 */