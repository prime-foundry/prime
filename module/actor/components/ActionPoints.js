
import BaseValueMaxComponent from './util/BaseValueMaxComponent.js';
export default class ActionPoints extends BaseValueMaxComponent {
    constructor(parent) {
        super(parent);
    }

    get base() {
        let base = super.base;
        // fix for old sheets
        if(base == null) {
            base = this._data.base = 6;
            this._update();
        }
        return base;
    }
    get bonus() {
        return this._actor.getStatBonusesFromItems("actionPoints");
    }
   get _data() {
        return this._actorSystemData.actionPoints;
    }
}