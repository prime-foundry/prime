import {getComponentLazily} from "../../util/support.js";
import {PointsBase} from "./Points.js";
import Component from "../../util/Component.js";
import {PrimeModifierManager} from "../../item/PrimeModifierManager.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import InjuryItem from "../../item/types/InjuryItem.js";

/**
 * @extends InventoryItem
 */
class EmbeddedInjuryItem extends EmbeddedDocumentMixin(InjuryItem) {
    constructor(parent, item) {
        super(parent, item);
    }

    get injuryIndex() {
        return this.gameSystem.injuryIndex;
    }

    set injuryIndex(injuryIndex) {
        this.write(this.gameSystemPath.with('injuryIndex'), injuryIndex)
    }
}

const NON_INJURY = {
    id: '',
    placeholder: true,
};

export default class Health extends Component {
    constructor(parent) {
        super(parent);
    }

    /**
     * @return {Wounds}
     */
    get wounds() {
        return getComponentLazily(this, 'wounds', Wounds);
    }

    set wounds(value) {
        this.wounds.value = value;
    }

    /**
     * @return {Resilience}
     */
    get resilience() {
        return getComponentLazily(this, 'resilience', Resilience);
    }

    set resilience(value) {
        this.resilience.value = value;
    }

    /**
     * @return {Insanities}
     */
    get insanities() {
        return getComponentLazily(this, 'insanities', Insanities);
    }

    set insanities(value) {
        this.insanities.value = value;
    }

    /**
     * @return {Psyche}
     */
    get psyche() {
        return getComponentLazily(this, 'psyche', Psyche);
    }

    set psyche(value) {
        this.psyche.value = value;
    }
}

/**
 * Injuries have 2 states
 * Tended,
 * Tended wounds are persistant and might come back.
 * Healed,
 * Healed wounds are gone.
 */
class InjurableBase extends PointsBase {

    constructor(parent) {
        super(parent);
    }

    /**
     * If the injuries are tended, then the injuries count as not existing towards the total. However we need to accommodate it on the UI.
     * @return {*}
     */
    get slots() {
        return Math.max(this.max, this.value);
    }

    /**
     * Migrated => Item As Wounds
     */
    get value() {
        return this.injuries.filter(injury => injury != null).length
    }

    /**
     * Migrated => Item As Wounds
     */
    sort() {
        // tended first
        // followed by injuries with details, ordered alphabetcally
        this.injuries
            .filter(injury => !!injury)
            .sort((firstInjury, secondInjury) => {
                if (firstInjury.tended ^ secondInjury.tended) {
                    return firstInjury.tended ? -1 : +1;
                }
                if (firstInjury.name != null) {
                    return secondInjury.name == null ? -1 : firstInjury.name.localeCompare(secondInjury.name);
                }
                return secondInjury.name == null ? 0 : +1;
            }).forEach((injury, index) => injury.injuryIndex = index);
    }

    getInjury(id) {
        const injury = this.document.items.get(id);
        if(injury){
            return new EmbeddedInjuryItem(this, injury);
        }
    }

    /**
     * Migrated => Item As Wounds
     */
    async injure({index, id, selected}) {
        const oldInjury = this.getInjury(id);

        if(oldInjury != null) {
            await oldInjury.deleteItem(false);
        }
        if(selected.length > 0){
            const injuryState = oldInjury != null ? oldInjury.injuryState : "untended";
            const injurySelected = ItemDirectory.collection.get(selected);
            const injuryToCreate = injurySelected.toObject(false);
            // Fixes issues whereby compendiums have new IDs assigned.
            injuryToCreate.data.metadata.sourceKey = selected;
            injuryToCreate._id = undefined;
            injuryToCreate.data.injuryIndex = index || 0;
            injuryToCreate.data.injuryState = injuryState;
            await this.document.createEmbeddedDocuments("Item", [injuryToCreate], {render:false, renderSheet:false});
        }
    }

    displayInjury({id}){
        this.getInjury(id).display();
    }

    /**
     * UI Function
     * @param index
     */
    cure({id}) {
        const injury = this.getInjury(id);
        if (injury) {
            injury.cure();
        }
    }

    /**
     * UI Function
     * @param activate
     * @param inputPrimeData
     */
    aggravateOrAlleviate({activate, id}) {
        const injury = this.getInjury(id);
        // if we have activated this wound,
        if (injury) {
            if (activate) {
                // I am simplyfing functionality to begin with.
                if(injury.tended){
                    injury.aggravate();
                }
            } else if (injury.untended) {
                injury.tend();
            }
        }
    }

    /**
     * We can't use sort as we purposefully have holes in the array.
     * @protected
     */
    get injuries() {
        const transformed = new Array(this.max);
        transformed.fill(null);
        const criteria = {itemCollection: this.document.items, itemBaseTypes: 'injury', typed: true, sortItems: true};
        const items = PrimeItemManager.getItems(criteria);
        const filtered = items.filter(item => item.source.injuryType === this.injuryType && ["tended", "untended"].includes(item.injuryState));
        const mapped = filtered.map(item => new EmbeddedInjuryItem(this, item));
        let invalidIndexes = false;

        mapped.forEach(item => {
            if (item.injuryIndex != null && transformed[item.injuryIndex] == null) {
                transformed[item.injuryIndex] = item;
            } else {
                invalidIndexes = true;
            }
        });
        if (invalidIndexes) {
            console.warn('Something went awry and the indexes of the injuries messed up, doing best fit fix.')
            const max = this.max;
            mapped.forEach(item => {
                if (item.injuryIndex == null || transformed[item.injuryIndex] !== item) {
                    for (let idx = 0; idx < max; idx++) {
                        if (transformed[idx] == null) {
                            item.injuryIndex = idx;
                            transformed[idx] = item;
                            break;
                        }
                    }
                }
            });
        }
        return transformed.map(item => item == null ? NON_INJURY : item);
    }

    get injuryType() {
        return '';
    }

}

class Wounds extends InjurableBase {
    constructor(parent) {
        super(parent);
    }

    get injuryType() {
        return 'wound';
    }

    get bonus() {
        return PrimeModifierManager.getModifiers("health.wounds.max", this.document);
    }

    /**
     * @protected
     */
    get points() {
        return this.gameSystem.health.wounds;
    }

    get pointsPath() {
        return this.statsPath.with('health').with('wounds');
    }

}

class Resilience extends PointsBase {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return PrimeModifierManager.getModifiers("health.resilience.max", this.document);
    }

    /**
     * @protected
     */
    get points() {
        return this.gameSystem.health.resilience;
    }

    get pointsPath() {
        return this.gameSystemPath.with('health', 'resilience');
    }
}

class Insanities extends InjurableBase {
    constructor(parent) {
        super(parent);
    }

    get injuryType() {
        return 'insanity';
    }

    get bonus() {
        return PrimeModifierManager.getModifiers("health.insanities.max", this.document);
    }

    /**
     * @protected
     */
    get points() {
        return this.gameSystem.mind.insanities;
    }

    get pointsPath() {
        return this.statsPath.with('health').with('mind');
    }
}

class Psyche extends PointsBase {
    constructor(parent) {
        super(parent);
    }

    get bonus() {
        return PrimeModifierManager.getModifiers("health.psyche.max", this.document);
    }

    /**
     * @protected
     */
    get points() {
        return this.gameSystem.mind.psyche;
    }


    get pointsPath() {
        return this.gameSystemPath.with('mind', 'psyche');
    }
}

