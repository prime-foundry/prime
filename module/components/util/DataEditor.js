/**
 * A class which implements the JS Proxy, handler interface.
 */
class DataEditorProxyHandler {
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
           this.editors.set(prop, Proxy.revocable(value, new DataEditorProxyHandler(this, prop)));
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
                this.editors.set(prop, Proxy.revocable(value, new DataEditorProxyHandler(this, prop)));
            } else {
                this.editors.delete(prop);
            }
        }
        if(Reflect.set(...arguments)){
            this._getEditableObject(true)[prop] = value;
            return true;
        }
        return false;
    }

    /**
     * This is mostly for functions such as push, get, or delete on an array etc, generally we shouldn't be calling functions on the edit objects,
     * the function has to be called twice and its going to be a pain to intercept in a debugger. In most cases on an array, the get handler (above) will
     * suffice
     * However I suspect we may need it for some manipulations, so I have put a console output in there so we can identify when it is happening.
     * Fingers Crossed it never logs.
     * TODO: Recognise collection types and create a specialised proxy handler for those. Then remove this method as a general one.
     * TODO: we will probably have to create a proxy for the returned value too.
     *
     * @param {function} target - the target function
     * @param thisArg - the context the function is being called
     * @param argumentsList - the passed arguments
     * @returns {*}
     */
    apply(target, thisArg, argumentsList) {
        console.warn("Try and avoid calling functions on the edit objects");
        const ret = Reflect.apply(...arguments);
        if(thisArg == null || thisArg == target) {
            const editTarget = this._getEditableObject(true);
            target.apply(editTarget, ...argumentsList);
        }
        return ret;
    }

    /**
     * returns the editable object, we also double utilise this method to optionally mark the context dirty,
     * this is generally because its multiple steps up and down.
     * @param markdirty
     * @returns {{}|*}
     */
    _getEditableObject(mark_dirty = false) {
        const parentObject = this.parent._getEditableObject(mark_dirty);
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
        this.resetEditor();
    }

    /**
     * Resets the editor to be a fresh one with the new data, if provided. Otherwise uses the already set document.data object.
     * @param {DocumentData} (data=previousData)
     */
    resetEditor(data = this.read){
        if(this.write != null){
            this.write.revoke()
            this.write = null;
        }
        if(data != null) {
            this._editor_handler = new DataEditorProxyHandler(this, 'data')
            this.write = Proxy.revocable(data, this._editor_handler);
        }
        this.clear();
    }

    clear(){
        this.changes = null;
    }

    /**
     * Commits any changes that may of occured.
     * Note: as opposed to the normal foundry update, where render is true, we default it to false instead..
     * If you provide a context object and don't set the render property, it will default it to false for you.
     * This is different to the normal foundry behaviour.
     * @param {DocumentModificationContext} (context)
     */
    commit(context = {}) {
        // get the object we create for partially updating.
        if(this.dirty && this.changes != null){
            if(context.render == null){
                context.render = false;
            }
            this.dirty = false;
            const changes = this.changes.data;
            this.clear();
            this.document.update(changes, context)
        }
    }

    /**
     * @protected
     * @param markdirty
     * @returns {*|{}}
     */
    _getEditableObject(mark_dirty = false) {
        if(mark_dirty){
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
 * @property {boolean} [render=false]          Automatically re-render existing applications associated with the document.
 *  The original default context object normally specifies this as true, but in the case, we are removing the constant re-rendering.
 * @property {boolean} [renderSheet=false]    Automatically create and render the Document sheet when the Document is first created.
 * @property {boolean} [diff=true]            Difference each update object against current Document data to reduce the size of the transferred data. Only used during update.
 * @property {boolean} [recursive=true]       Merge objects recursively. If false, inner objects will be replaced explicitly. Use with caution!
 * @property {boolean} [isUndo]               Is the operation undoing a previous operation, only used by embedded Documents within a Scene
 * @property {boolean} [deleteAll]            Whether to delete all documents of a given type, regardless of the array of ids provided. Only used during a delete operation.
 */