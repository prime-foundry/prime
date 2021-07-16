import DataManager from "./DataManager.js";
import Controller from "./Controller.js";

class GlobalTypeRegistry {
    static registry = new Map();

    static register(modelName) {
        if (!GlobalTypeRegistry.registry.has(modelName)) {
            GlobalTypeRegistry.registry.set(modelName, new TypeRegistry());
            return true;
        }
        return false;
    }

    static getTypeRegistry(modelName) {
        return GlobalTypeRegistry.registry.get(modelName);
    }

    static get(modelName, typeName) {
        const typeRegistry = GlobalTypeRegistry.getTypeRegistry(modelName);
        if(typeRegistry == null){
            return null;
        }
        return typeRegistry.get(typeName);
    }
}

class TypeRegistry {
    registry = new Map();

    register(typeName, Type) {
        if (!this.registry.has(typeName)) {
            this.registry.set(typeName, Type)
        }
    }

    get(typeName) {
        return this.registry.get(typeName);
    }
}

class DynModel {
    managed;
    dataManager;
    modelName;
    typeProperty;

    constructor(managed, modelName, typeProperty) {
        this.managed = managed;
        this.dataManager = new DataManager(this.managed);
        this.modelName = modelName;
        this.typeProperty = typeProperty
    }

    get typed() {
        if (this.typeProperty == null) {
            return this.managed;
        } else {
            const Type = GlobalTypeRegistry.get(this.modelName, this.managed[this.typeProperty]);
            if (Type == null) {
                return this.managed;
            }
            return new Type(this.managed);
        }
    }

    /**
     * The base content of any document, generally it follows a fixed structure, as defined by a schema.
     *
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @returns {typeof foundry.abstract.DocumentData}
     */
    get content() {
        return this.managed.data;
    }


    /**
     * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {Object}
     */
    get system() {
        return this.content.data;
    }

    /**
     * Given a path from document data, and a value set the value at that path point.
     *
     * The base content of any document, generally it follows a fixed structure, as defined by a schema.
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @param path
     * @param value
     * @returns {*} the last value that had been set.
     */
    writeToContent(path, value) {
        return this.dataManager.write(`data.${path}`, value);
    }

    /**
     * Given a path from system data, and a value set the value at that path point.
     *
     * system data is the freeform add whatever you want to data, it is generally based on the template set for the system.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {*} the last value that had been set.
     */
    writeToSystem(path, value) {
        return this.dataManager.write(`data.data.${path}`, value);
    }

}

/**
 * @exports DynDocument
 * @param {foundry.abstract.Document} FoundryDocumentType
 * @param {string} modelName the name to use as the model, for the use by controllers.
 * @param {string} typeProperty the type we might want to mixin, on the application.
 * @returns {module:DynDocument~mixin}
 * @constructor
 */
export const DynDocumentMixin = (FoundryDocumentType, modelName = 'doc', typeProperty = undefined) =>

    /**
     * @mixin
     * @alias module:DynDocument~mixin
     * @extends foundry.abstract.Document
     */
    class extends FoundryDocumentType {
        get dyn() {
            if (this._dyn == null) {
                this._dyn = new DynModel(this, modelName, typeProperty);
                if (typeProperty != null && GlobalTypeRegistry.register(modelName)) {
                    this.registerDynTypes(GlobalTypeRegistry.getTypeRegistry(modelName));
                }
            }
            return this._dyn;
        }

        registerDynTypes(registry) {
        }
    };

class DynView {
    controller;

    constructor(managed) {
        this.controller = new Controller(managed.dynModels);
    }

}

/**
 * @exports DynApplication
 * @param {Application} FoundryApplicationType
 * @param {string} viewName the name to use as the model, for the use by controllers.
 * @returns {module:DynApplication~mixin}
 * @constructor
 */
export const DynApplicationMixin = (FoundryApplicationType, viewName = 'sheet') =>

    /**
     * @mixin
     * @alias module:DynApplication~mixin
     * @extends Application
     */
    class extends FoundryApplicationType {

        get dyn() {
            if (this._dyn == null) {
                this._dyn = new DynView(this);
            }
            return this._dyn;
        }

        get dynModels() {
            if (this._dynModels == null) {
                const models = {};
                models[viewName] = this;
                const doc = this.document;
                if (doc && doc.dyn) {
                    models[doc.dyn.modelName] = doc.dyn.typed;
                } else {
                    models.doc = doc;
                }
                this._dynModels = models;
            }
            return this._dynModels;
        }


        /** @override */
        activateListeners(html) {
            super.activateListeners(html);
            this.dyn.controller.control(html);
        }
    };
