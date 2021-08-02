import {getComponentLazily} from "../../util/support.js";
import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import StatItem from "../../item/components/typed/StatItem.js";

class Stat extends EmbeddedDocumentMixin(StatItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

class StatCollection extends Component {
    constructor(parent) {
        super(parent);
    }

    // at some point this needs to work out the correct values depending on the compendium.
    get statTypes() {
        return ['physical', 'mental', 'supernatural'];
    }

    get all() {
        return Object.fromEntries(this.statTypes.map(statType => [statType, this.getStatsForType(statType)]));
    }

    get cost() {
        return this._getTransformedItems().reduce((accumulator, stat) => accumulator + stat.cost, 0);
    }

    getStatsForType(statType) {
        return this._getTransformedItems().filter(stat => stat.statType === statType);
    }

    getStatById(id){
       return this._getTransformedItems().find((stat) => stat.id === id);
    }

    displayStat({id}){
        this.getStatById(id).display();
    }

    setStatValue({value, key}){
        const stat = this.getStatById(key);
        stat.value = value;
    }

    _getTransformedItems() {
        return [];
    }
}

class Primes extends StatCollection {

    constructor(parent) {
        super(parent);
    }

    _getTransformedItems() {
		let primes = this.document._getItemsByType('prime')
                .sort((one, two) => one.name.localeCompare(two.name))
                .map(item => new Stat(this, item));

        return primes;
    }
}

class Refinements extends StatCollection {
    constructor(parent) {
        super(parent);
    }

    _getTransformedItems() {
		let refinements = this.document._getItemsByType('refinement')
                .sort((one, two) => one.name.localeCompare(two.name))
                .map(item => new Stat(this, item));

        return refinements;
    }
}


export default class Stats extends Component {
    constructor(parent) {
        super(parent);
    }

    /**
     * @return {Primes}
     */
    get primes() {
        return getComponentLazily(this, 'primes', Primes);
    }

    /**
     * @return {Primes}
     */
    get refinements() {
        return getComponentLazily(this, 'refinements', Refinements);
    }

    get sorted() {
        const primes = this.primes.all;
        const refinements = this.refinements.all;
        return Object.entries(primes).map(([statType, stats]) =>
            ({
                statType,
                primes: stats,
                refinements: refinements[statType],
                title: game.i18n.localize(`PRIME.stat_type_${statType}`),
            })
        );
    }
}