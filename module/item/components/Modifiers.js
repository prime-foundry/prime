import Component from "../../util/Component.js";
import PrimeItemTables from "../PrimeItemTables.js";
import {getter} from "../../util/dyn_helpers.js";
const IS_ACTION = (type) => ['action', 'extraAction'].includes(type);
export class Modifiers extends Component {
_modifiersPropertyName;
    constructor(parent, modifiersPropertyName = "modifiers") {
        super(parent);
        this._modifiersPropertyName = modifiersPropertyName;
        getter(this, 'collection', () => {
            return Array.from(this.modifiers || []).map((modifier, index) => {

                const modifierCategory = (PrimeItemTables.modifiers[modifier.type] || {}).category;
                if (modifierCategory === 'otherItem') {
                    if(IS_ACTION(modifier.type)) {
                        return new AddedActionModifier(this, index, modifierCategory);
                    }
                    return new OtherItemModifier(this, index, modifierCategory);
                }
                return new Modifier(this, index, modifierCategory);
            });
        }, {cached:true});
    }

    getModifiersByCategory(modifierCategory) {
        return this.collection.filter(modifier => modifier.category === modifierCategory);
    }

    getActions() {
        const actions = this.collection
            .filter(modifier => modifier.category === 'otherItem')
            .flatMap((modifier) => {
                const item = modifier.getItem();
                if(IS_ACTION(modifier.type)) {
                    return item;
                }
                return item[this._modifiersPropertyName].getActions();
            });
        return actions;
    }

    get modifiers() {
        return this.gameSystem[this._modifiersPropertyName];
    }

    pathToModifiers() {
        return this.gameSystemPath.with(this._modifiersPropertyName);
    }

    compactModifiers() {
        const compacted = Array.from(this.modifiers || []).filter(modifier => modifier != null);
        this.write(this.pathToModifiers(), compacted);
    }

    add() {
        const modifier = PrimeItemTables.defaultModifier;
        this.write(this.pathToModifiers().with((this.modifiers || []).length || 0), modifier);
    }

    modifierFor(actorDoc, ownedItem, target, options = {}) {
        return this.collection.reduce((previous, modifier) => previous + modifier.modifierFor(actorDoc, ownedItem, target, options), 0);
    }

    * [Symbol.iterator]() {
        yield* this.collection;
    }
}

export class Modifier extends Component {
    index;
    category;

    constructor(parent, index, category) {
        super(parent);
        this.index = index;
        this.category = category;
    }

    get type() {
        return this.getModifierData().type;
    }

    set type(type) {
        this.write(this.pathToModifier().with('type'), type);
    }

    get situational() {
        return !!this.getModifierData().situational;
    }

    set situational(situational) {
        this.write(this.pathToModifier().with('situational'), !!situational);
    }

    get equipped() {
        return !!this.getModifierData().equipped;
    }

    set equipped(equipped) {
        this.write(this.pathToModifier().with('equipped'), !!equipped);
    }

    get target() {
        return this.getModifierData().target;
    }

    set target(target) {
        this.write(this.pathToModifier().with('target'), target);
    }

    get value() {
        return this.getModifierData().value;
    }

    set value(value) {
        this.write(this.pathToModifier().with('value'), value)
    }


    get rules() {
        return this.getModifierData().rules;
    }

    set rules(rules) {
        this.write(this.rules_path, rules)
    }

    get rules_path() {
        return this.pathToModifier().with('rules');
    }


    getModifierData() {
        return this.parent.modifiers[this.index] || {};
    }

    pathToModifier() {
        return this.parent.pathToModifiers().with(this.index);
    }

    delete() {
        this.write(this.pathToModifier(), null);
        this.parent.compactModifiers();
    }

    modifierFor(actorDoc, ownedItem, target, options = {}) {

        const {includeSituational = false, includeUnequipped = false} = options
        if (this.target !== target) {
            return 0;
        }
        if (!includeSituational && this.situational) {
            return 0;
        }
        if ((!includeUnequipped) && this.equipped && ownedItem.equippable && (!ownedItem.equipped)) {
            return 0;
        }
        return this.value;
    }
}

export class AddedActionModifier extends Modifier {

    constructor(parent, index, category) {
        super(parent, index, category);
    }

    modifierFor(actorDoc, ownedItem, target, options = {}) {
        return 0;
    }

    getItem() {
        const itemDoc = ItemDirectory.collection.get(this.target);
        if (itemDoc == null) {
            console.warn(`AddedActionModifier is unable to find an  Item:'${this.document.name}':'${this.document.id}' for target:'${this.target}' at modifier index:'${this.index}'`);
            return null;
        }
        return itemDoc.dyn.typed;
    }
}

export class OtherItemModifier extends Modifier {

    constructor(parent, index, category) {
        super(parent, index, category);
    }

    modifierFor(actorDoc, ownedItem, target, options = {}) {
        const {qualifies = true, includeSituational = false, includeUnequipped = false} = options

        if (!includeSituational && this.situational) {
            return 0;
        }
        if ((!includeUnequipped) && this.equipped && ownedItem.equippable && (!ownedItem.equipped)) {
            return 0;
        }

        const item = this.getItem();
        if (item == null) {
            return 0;
        }
        if (qualifies && !item.qualifies(actorDoc)) {
            return 0;
        }
        return item.modifierFor(actorDoc, ownedItem, target, options);
    }

    getItem() {
        const itemDoc = ItemDirectory.collection.get(this.target);
        if (itemDoc == null) {
            console.warn(`OtherItemModifier is unable to find an Item:'${this.document.name}':'${this.document.id}' for target:'${this.target}' at modifier index:'${this.index}'`);
            return null;
        }
        return itemDoc.dyn.typed;
    }
}