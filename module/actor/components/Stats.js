import EmbeddedDocumentComponent from "../../util/EmbeddedDocumentComponent.js";
import {getComponentLazily} from "../../util/support.js";
import Component from "../../util/Component.js";

class Stat extends EmbeddedDocumentComponent {

    constructor(parent, item) {
        super(parent, item);
    }

    get customisable() {
        return !!this.gameSystem.customisable;
    }

    get default() {
        return !!this.gameSystem.default;
    }

    get statType() {
        return this.gameSystem.statType;
    }

    get description() {
        return this.gameSystem.description;
    }

    get directory() {
        return ItemDirectory;
    }

    get sourceKey() {
        return this.gameSystem.sourceKey;
    }

    get title() {
		// TODO: Check if this is still required post migration to V2 data.
		// Try one and fallback if not present.
        return this.gameSystem.name || this.document.name;
    }

    get max() {
        return this.gameSystem.max;
    }

    get related() {
        return [];
    }

    get value() {
        return this.gameSystem.value;
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this.write(this.gameSystemPath.with('value'), value);
        }
    }

    get cost() {
        const num = this.value;
        return (num === 0) ? 0 : ((num * (num + 1)) / 2);
    }
}

class Prime extends Stat {
    constructor(parent, item) {
        super(parent, item);
    }
}

class Refinement extends Stat {
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
                .map(item => new Prime(this, item));

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
                .map(item => new Refinement(this, item));

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