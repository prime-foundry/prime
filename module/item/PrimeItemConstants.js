import {PrimeItemManager} from "./PrimeItemManager.js";
import {prerequisiteClassNameToClass, Prerequisites} from "./components/Prerequisites.js";
import {TemplateTable} from "../util/TemplateTable.js";
import PrimeActorConstants from "../actor/PrimeActorConstants.js";
import {arrayIfNot} from "../util/support.js";

const QUALIFIERS = new Map()
    .set('EXISTS', {unary: true, types: ['object'], predicate: (a) => a != null})
    .set('MISSING', {unary: true, types: ['object'], predicate: (a) => a == null})
    .set('GREATER', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) > (b || 0)})
    // .set('GREATER_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) >= (b || 0)})
    .set('LESS', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) < (b || 0)})
    // .set('LESS_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => (a || 0) <= (b || 0)})
    .set('EQUALS', {unary: false, types: ['string', 'number', 'boolean'], predicate: (a, b) => a == b})
    .set('NOT_EQUALS', {unary: false, types: ['string', 'number', 'boolean'], predicate: (a, b) => a != b})
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
            const transformed = {};
            Object.entries(this.data).forEach(([key, prerequisiteData]) => {
                    const title = game.i18n.localize(prerequisiteData.title);
                    const Type = prerequisiteClassNameToClass(prerequisiteData.class);
                    const subTypes = PrerequisitesTable.loadSubTypes(Type, prerequisiteData);
                    transformed[key] = {title, subTypes, class: prerequisiteData.class};
                }
            );
            this._prerequisites = transformed;
        }
        return this._prerequisites;
    }

    get defaultPrerequisite() {
        const [type, ] = Object.entries(this.prerequisites).shift();
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
        const transformed = {}
        const actorLookups = PrimeActorConstants.stats.lookups;
        Object.entries(actorLookups).forEach(([key, actorData]) => {
                const valueTypes = arrayIfNot(actorData.valueTypes);
                const qualifiers = PrerequisitesTable.loadQualifiers(valueTypes);
                const title = actorData.title;
                transformed[key] = {title, qualifiers, valueTypes};
            }
        );
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
            const transformed = {};
            Object.entries(this.data).forEach(([key, modifierData]) => {
                    const title = game.i18n.localize(modifierData.title);
                    const category = modifierData.category;
                    const subTypes = ModifiersTable.loadSubTypes(category, modifierData);
                    transformed[key] = {title, subTypes, category};
                }
            );
            this._modifiers = transformed;
        }
        return this._modifiers;
    }

    get defaultModifier() {
        const [type, ] = Object.entries(this.modifiers).shift();
        const target = '';
        const value = 0;
        const situational = true;
        const equipped = false;
        return {type, target, value,situational, equipped};
    }

    static loadSubTypes(category, modifierData) {
        if (category === 'item') {
            return ModifiersTable.loadItemSubType(arrayIfNot(modifierData.itemBaseTypes, true));
        } else if (category === 'actor') {
            return ModifiersTable.loadActorSubType();
        }  else if (category === 'otherItem') {
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
        const actorLookups = PrimeActorConstants.stats.lookups;
        Object.entries(actorLookups)
            .filter(([,actorData]) => actorData.modifiable)
            .forEach(([key, actorData]) => {
                    const title = actorData.title;
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

export default class PrimeItemConstants {
    static _modifiers = new ModifiersTable();
    static _prerequisites = new PrerequisitesTable()

    static get modifiers() {
        return this._modifiers.modifiers;
    }

    static get defaultModifier(){
        return this._modifiers.defaultModifier;
    }

    static get prerequisites() {
        return this._prerequisites.prerequisites;
    }

    static get defaultPrerequisite(){
        return this._prerequisites.defaultPrerequisite;
    }

    static qualifierForKey(key) {
        return QUALIFIERS.get(key);
    }

    static isUnaryQualifier(qualifier) {
        return (QUALIFIERS.get(qualifier) || {unary: true}).unary;
    }

}