import {PrimeItemManager} from "./PrimeItemManager.js";
import {prerequisiteClassNameToClass} from "./components/Prerequisites.js";
import {loadBasicData, loadComplexData, TemplateTable} from "../util/TemplateTable.js";
import PrimeActorTables from "../actor/PrimeActorTables.js";
import {arrayIfNot} from "../util/support.js";
import PrimeTables from "../PrimeTables.js";

const QUALIFIERS = new Map()
    .set('EXISTS', {unary: true, types: ['object'], predicate: (a) => a != null})
    .set('MISSING', {unary: true, types: ['object'], predicate: (a) => a == null})
    // .set('GREATER', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) > (b || 0)})
    .set('GREATER_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) >= (b || 0)})
    // .set('LESS', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) < (b || 0)})
    .set('LESS_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) <= (b || 0)})
    .set('TRUE', {unary: true, types: ['boolean'], predicate: (a) => a})
    .set('FALSE', {unary: true, types: ['boolean'], predicate: (a) => !a})
    .set('EQUALS', {unary: false, types: ['string', 'number'], predicate: (a, b) => a == b})
    .set('NOT_EQUALS', {unary: false, types: ['string', 'number'], predicate: (a, b) => a != b})
    .set('CONTAINS', {unary: false, types: ['string'], predicate: (a, b) => a.contains(b)})
    .set('STARTS_WITH', {unary: false, types: ['string'], predicate: (a, b) => a.startsWith(b)})
    .set('ENDS_WITH', {unary: false, types: ['string'], predicate: (a, b) => a.endsWith(b)});

class PrerequisitesTable extends TemplateTable {

    _prerequisites;

    constructor() {
        super('prerequisites')
    }

    get prerequisites() {
        if (this._prerequisites == null) {
            const transformed = loadComplexData(this.data, (key, prerequisiteData) => {
                const Type = prerequisiteClassNameToClass(prerequisiteData.class);
                const subTypes = PrerequisitesTable.loadSubTypes(Type, prerequisiteData);
                return {subTypes, class: prerequisiteData.class};
            });
            this._prerequisites = transformed;
        }
        return this._prerequisites;
    }

    get defaultPrerequisite() {
        const [type,] = Object.entries(this.prerequisites).shift();
        const target = '';
        const qualifier = '';
        const value = '';
        return {type, target, qualifier, value};
    }

    static loadSubTypes(Type, prerequisiteData) {
        const subType = Type.subType;
        if (subType === 'item') {
            return PrerequisitesTable.loadItemSubType(Type, arrayIfNot(prerequisiteData.itemBaseTypes, true));
        } else if (subType === 'actor') {
            return PrerequisitesTable.loadActorSubType();
        }
    }

    static loadActorSubType() {
        const actorLookups = PrimeActorTables.lookups;

        const transformed = loadComplexData(actorLookups, (key, actorData) => {
            const valueTypes = arrayIfNot(actorData.valueTypes);
            const qualifiers = PrerequisitesTable.loadQualifiers(valueTypes);
            const title = actorData.title;
            return {title, qualifiers, valueTypes};
        });
        return transformed;
    }

    static loadItemSubType(Type, itemBaseTypes) {
        const transformed = {}
        const criteria = {itemBaseTypes, typed: true, sortItems: true};
        const items = PrimeItemManager.getItems(criteria);

        items.forEach(item => {
            const valueTypes = arrayIfNot(Type.supportedValueTypes(item));
            const qualifiers = PrerequisitesTable.loadQualifiers(valueTypes);
            const key = item.id; // this will become sourceKey for embedded items.
            const title = game.i18n.localize(item.name);
            transformed[key] = {title, qualifiers, valueTypes};
        });
        return transformed;
    }

    static loadQualifiers(valueTypes) {
        let qualifiers = Array.from(QUALIFIERS.entries());
        if (valueTypes != null) {
            qualifiers = qualifiers.filter(([, qualifier]) => qualifier.types === undefined
                || valueTypes.some(type => qualifier.types.includes(type)));
        }
        const transformed = {};
        qualifiers.forEach(([key, qualifier]) =>
            transformed[key] = {
                requiresValue: !qualifier.unary,
                title: game.i18n.localize(`PRIME.qualifier_key_${key}`),
                predicate: qualifier.predicate
            });
        return transformed;
    }
}

class ModifiersTable extends TemplateTable {

    constructor() {
        super('modifiers')
    }

    _modifiers;

    get modifiers() {
        if (this._modifiers == null) {

            const transformed = loadComplexData(this.data, (key, modifierData) => {
                const category = modifierData.category;
                const subTypes = ModifiersTable.loadSubTypes(category, modifierData);
                return {subTypes, category};
            });
            this._modifiers = transformed;
        }
        return this._modifiers;
    }

    get defaultModifier() {
        const [type,] = Object.entries(this.modifiers).shift();
        const target = '';
        const value = 0;
        const situational = false;
        const equipped = true;
        return {type, target, value, situational, equipped};
    }

    static loadSubTypes(category, modifierData) {
        if (category === 'item') {
            return ModifiersTable.loadItemSubType(arrayIfNot(modifierData.itemBaseTypes, true));
        } else if (category === 'actor') {
            return ModifiersTable.loadActorSubType();
        } else if (category === 'otherItem') {
            return ModifiersTable.loadModifierSubType(arrayIfNot(modifierData.itemBaseTypes, true));
        }
        // misc doesn't have subtypes
    }

    static loadItemSubType(itemBaseTypes) {
        const transformed = {}
        const criteria = {itemBaseTypes, typed: true, sortItems: true};
        const items = PrimeItemManager.getItems(criteria);
        items.forEach(item => {
            const key = item.id; // this will become sourceKey for embedded items.
            const title = game.i18n.localize(item.name);
            transformed[key] = title;
        });
        return transformed;
    }

    static loadActorSubType() {
        const transformed = {}
        const actorLookups = PrimeActorTables.lookups;
        Object.entries(actorLookups)
            .filter(([, actorData]) => actorData.modifiable)
            .forEach(([key, actorData]) => {
                    const title = game.i18n.localize(actorData.title);
                    transformed[key] = title;
                }
            );
        return transformed;
    }

    static loadModifierSubType(itemBaseTypes) {
        const transformed = {}
        const criteria = {itemBaseTypes, typed: true, sortItems: true};
        const items = PrimeItemManager.getItems(criteria);
        items.forEach(item => {
            const key = item.id; // this will become sourceKey for embedded items.
            const title = game.i18n.localize(item.name);
            transformed[key] = title;
        });
        return transformed;
    }
}


class ActionsTable extends TemplateTable {

    _types;
    _effects;

    constructor() {
        super('actions')
    }

    get types() {
        if (this._types == null) {
            this._types = loadBasicData(this.data.types);
        }
        return this._types;
    }

    get effects() {
        if (this._effects == null) {
            this._effects = ActionsTable.loadEffects(this.data);
        }
        return this._effects;
    }

    get defaultActionEffect() {
        const [type,] = Object.entries(this.effects).shift();
        const target = '';
        const value = 0;
        return {type, target, value};
    }

    static loadEffects({effects}) {
        const transformed = loadComplexData(effects, (key, effectsData) => {
            const category = effectsData.category;
            const subTypes = ActionsTable.loadEffectsSubTypes(category, effectsData)
            return {subTypes, category};
        });
        return transformed;
    }

    static loadEffectsSubTypes(category, modifierData) {
        if (category === 'item') {
            // code is the same.
            return ModifiersTable.loadItemSubType(arrayIfNot(modifierData.itemBaseTypes, true));
        } else if (category === 'actor') {
            return ActionsTable.loadEffectsActorSubType();
        } else if (category === 'otherItem') {
            // code is the same.
            return ModifiersTable.loadModifierSubType(arrayIfNot(modifierData.itemBaseTypes, true));
        }
        // misc doesn't have subtypes
    }

    static loadEffectsActorSubType() {
        const transformed = {}
        const actorLookups = PrimeActorTables.lookups;
        Object.entries(actorLookups)
            .filter(([, actorData]) => actorData.actionable)
            .forEach(([key, actorData]) => {
                    const title = actorData.title;
                    transformed[key] = title;
                }
            );
        return transformed;
    }
}

class RarityTable extends TemplateTable {

    _rarity;

    constructor() {
        super('rarity')
    }

    get rarity() {
        if (this._rarity == null) {
            this._rarity = loadBasicData(this.data);
        }
        return this._rarity;
    }

}


class ArmourTable extends TemplateTable {

    _types;
    _keywords;
    _untrainedPenalties;

    constructor() {
        super('items.armour')
    }

    get types() {
        if (this._types == null) {
            this._types = loadBasicData(this.data.types);
        }
        return this._types;
    }
    get keywords() {
        if (this._keywords == null) {
            this._keywords = loadBasicData(this.data.keywords);
        }
        return this._keywords;
    }

    get untrainedPenalties() {
        if (this._untrainedPenalties == null) {
            this._untrainedPenalties = loadBasicData(this.data.untrainedPenalties);
        }
        return this._untrainedPenalties;
    }
}

export default class PrimeItemTables {
    static _modifiers = new ModifiersTable();
    static _prerequisites = new PrerequisitesTable();
    static _actions = new ActionsTable();
    static _rarity = new RarityTable();
    static _armour = new ArmourTable();

    static get armour() {
        return this._armour;
    }

    static get modifiers() {
        return this._modifiers.modifiers;
    }

    static get defaultModifier() {
        return this._modifiers.defaultModifier;
    }

    static get prerequisites() {
        return this._prerequisites.prerequisites;
    }

    static get defaultPrerequisite() {
        return this._prerequisites.defaultPrerequisite;
    }

    static get rarity() {
        return this._rarity.rarity;
    }

    static get actionTypes() {
        return this._actions.types;
    }

    static get actionEffects() {
        return this._actions.effects;
    }

    static get defaultActionEffect() {
        return this._actions.defaultActionEffect;
    }

    static get lookups() {
        return PrimeTables.lookups.item;
    }

    static qualifierForKey(key) {
        return QUALIFIERS.get(key);
    }

    static isUnaryQualifier(qualifier) {
        return (QUALIFIERS.get(qualifier) || {unary: true}).unary;
    }
}