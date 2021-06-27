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
     * @param {PrimeDocument | Component} parent
     */
    constructor(parent) {
        this.__parent = parent;
        this.__document = parent instanceof Component ? parent._document : parent;
    }

    /**
     * @returns {PrimeDocument|Component}
     * @protected
     */
    get _parent() {
        return this.__parent;
    }

    /**
     * @returns {PrimeDocument}
     * @protected
     */
    get _document() {
        return this.__document;
    }

    /**
     * The write and the read maybe changed, so we don't store the editor directly, we simply reference it.
     * @returns {DataEditor}
     * @protected
     */
    get _editor() {
        return this._document.prime.editor;
    }

    /**
     * return a proxy to the data object that we can write too.
     *
     * @returns {{proxy: DocumentData}}
     * @protected
     */
    get _write() {
        return this._editor.write;
    }

    /**
     * return the data object that we can read from
     * @returns {DocumentData}
     * @protected
     */
    get _read() {
        return this._document.data;
    }

    /**
     * return the readable system data object (document.data.data),
     * @returns {{}}
     * @protected
     */
    get _systemRead(){
        this._read.data;
    }

    /**
     * return a writable proxy to the system data (document.data.data)
     * @returns {{proxy: {}}}
     * @protected
     */
    get _systemWrite(){
        this._write.data;
    }
}