import {TemplateTable} from "./util/TemplateTable.js";

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

export default class PrimeConstants {
    static _core = new CoreTable();

    static get settings() {
        return this._core.settings;
    }
    static get costs() {
        return this._core.costs;
    }
    static get spiritualCosts() {
        return this._core.spiritualCosts;
    }
    static get materialCosts() {
        return this._core.materialCosts;
    }
}