/**
 * A Component is just a proxy for an existing data store.
 * It doesn't store any real data, just the references to the data store,
 * however it should contain all the modification and utility functions, you might need.
 * Think of it as a cross between an Entity class and a Repository class in Domain Driven Design, (which is a bit like an Object Orientated DAO, or an ORM)
 *
 * This allows us to have clean separation of logical model and physical data store, the data store being a horrible mess.
 * It should also make migration between versions a bit more manageable.
 */
export default class Component {

    /**
     * @param {ComponentManager} manager
     */
    constructor(parent) {
        this.__parent = parent;
        this.__document = parent._primeDocumentMixin ? parent : parent._document;
    }

    get _parent() {
        return this.__parent;
    }

    get _document() {
        return this.__document;
    }

    /**
     * We could just let the data editor manage, we can probably do more funky things, if we do,
     * but this is something we can do later, and would involve just changing the return path of this get.
     * @returns {*}
     */
    get _readData() {
        return this._document.data;
    }

    get _readSystemData() {
        return this._readData.data;
    }

    /**
     * @returns {DataEditor}
     * @protected
     */
    get _dataEditor() {
        return this._document.prime.editor;
    }

    get _writeData() {
        return this._dataEditor.write;
    }

    get _writeSystemData() {
        return this._writeData.data;
    }

    /**
     * @param {DocumentModificationContext} (context)
     * @protected
     */
    _commit(context) {
        return this._dataEditor.commit(context);
    }
}