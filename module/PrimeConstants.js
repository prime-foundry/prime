import {TemplateTable} from "./util/TemplateTable.js";
import {arrayIfNot} from "./util/support.js";

class CoreTable extends TemplateTable {

    _settings;
    _costs;
    constructor() {
        super('core')
    }

    get settings() {
        if(this._settings == null){
            this._settings = this.data.settings.map((entry) => {
                const key = entry.key;
                const title = game.i18n.localize(entry.title);
                return {key, title};
            });
        }
        return this._settings;
    }
    get costs() {
        if(this._costs == null){
            this._costs = this.data.costs.map((entry) => {
                const key = entry.key;
                const title = game.i18n.localize(entry.title);
                const material = entry.material;
                return {key, title, material};
            });
        }
        return this._costs;
    }

    get spiritualCosts() {
        return this.costs.filter(item => !item.material);
    }

    get materialCosts() {
        return this.costs.filter(item => item.material);
    }

}

class Lookups extends TemplateTable{
    _lookups;
    constructor() {
        super('lookups');
    }

    get lookups() {
        if(this._lookups == null) {
            this._lookups = Lookups.loadLookups(this.data);
        }
        return this._lookups;
    }

    static loadLookups(lookups) {
        const transformed = {};
        Object.entries(lookups).forEach(([key, lookupData]) => {
                transformed[key] = Lookups.loadLookupsByType(lookupData);
            }
        );
        return transformed;
    }

    static loadLookupsByType(lookups) {
        const transformed = {};
        Object.entries(lookups).forEach(([key, lookupData]) => {
                const title = game.i18n.localize(lookupData.title);
                const valueTypes = arrayIfNot(lookupData.valueTypes) ;
                const modifiable = !!lookupData.modifiable;
                const actionable = !!lookupData.actionable;
                const path = lookupData.path || key;
                transformed[key] = {title, valueTypes, path, modifiable, actionable};
            }
        );
        return transformed;
    }
}

export default class PrimeConstants {
    static _core = new CoreTable();
    static _lookups = new Lookups();
    static get settings() {
        return this._core.settings;
    }
    static get costs() {
        return this._core.costs;
    }
    static get lookups() {
        return this._lookups.lookups;
    }
    static get spiritualCosts() {
        return this._core.spiritualCosts;
    }
    static get materialCosts() {
        return this._core.materialCosts;
    }
}