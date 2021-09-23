import {getComponentLazily} from "../../util/support.js";
import {Cost} from "../components/Costs.js";
import {Modifiers} from "../components/Modifiers.js";
import {Prerequisites} from "../components/Prerequisites.js";
import Component from "../../util/Component.js";

export default class Metrics extends Component {
    constructor(primeItem) {
        super(primeItem);
    }


    get metrics(){
        return this.gameSystem.metrics || {};
    }

    get metricsPath(){
        return this.gameSystemPath.with('metrics');
    }
    
    get quantity() {
        return this.metrics.quantity || 1;
    }

    set quantity(quantity) {
        return this.write(this.metricsPath.with('quantity'), quantity);
    }

    get weight() {
        return this.metrics.weight || 0;
    }

    set weight(weight) {
        return this.write(this.metricsPath.with('weight'), weight);
    }

    get rarity() {
        const rarity = this.metrics.rarity;
        return rarity != null ? rarity : 'common';
    }

    set rarity(rarity) {
        return this.write(this.metricsPath.with('rarity'), rarity);
    }
}