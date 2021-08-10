import JSONPathBuilder from "./JSONPathBuilder.js";

function dyn_callback() {
    console.debug(`dyn_callback reloading table: ${this.constructor.name}`);
    this.refresh();
}

function item_callback() {
    console.debug(`item_callback reloading table: ${this.constructor.name}`);
    this.itemRefresh();
}
export class TemplateTable {
    data;
    dataPath;

    constructor(path) {
        this.dataPath = JSONPathBuilder.from(path);
        Hooks.once('ready', this.init.bind(this));

        if (this.dynRefresh != null) {
            Hooks.on('dynDocumentUpdated', dyn_callback.bind(this));
        }
        if (this.itemRefresh != null) {
            Hooks.on('createItem', item_callback.bind(this));
            Hooks.on('updateItem', item_callback.bind(this));
            Hooks.on('deleteItem', item_callback.bind(this));
        }
    }

    init() {
        /*
         * deepClone is on the Global Scope
         * defined: FoundryVTT/resources/app/common/utils/helpers.mjs
         * api: https://foundryvtt.com/api/module-helpers.html#.deepClone
         */
        this.data = deepClone(this.dataPath.traverse(game.system.template.Tables));
        return this.data;
    }
}

export function loadBasicData(data) {
    return loadComplexData(data, () => ({}));
}

export function loadComplexData(data, fn) {
    const transformed = {}

    Object.entries(data).forEach(([key, subData]) => {
            const value = fn(key, subData);
            if (value.title == null && subData.title != null) {
                value.title = game.i18n.localize(subData.title)
            }
            if (value.description == null && subData.description != null) {
                value.description = game.i18n.localize(subData.description)
            }
            transformed[key] = value;
        }
    );
    return transformed;
}