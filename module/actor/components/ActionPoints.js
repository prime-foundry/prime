
import BaseValueMaxComponent from './util/BaseValueMaxComponent.js';
export default class ActionPoints extends BaseValueMaxComponent {
    constructor(actor) {
        super(actor);
    }

    getStatBonuses(){
        return this.actor.getStatBonusesFromItems("actionPoints");
    }
    getData() {
        return this.actorDataProperties.actionPoints;
    }
}