import {PrimeItemManager} from "./PrimeItemManager.js";
import JSONPathBuilder from "../util/JSONPathBuilder.js";
import {prerequisiteClassNameToClass, Prerequisites} from "./components/Prerequisites.js";

const QUALIFIERS = new Map()
	.set('EXISTS', {unary: true, types: ['object'], predicate: (a) => a != null})
	.set('MISSING', {unary: true, types: ['object'], predicate: (a) => a == null})
	.set('GREATER', {unary: false, types: ['number'], predicate: (a, b) => a > b})
	.set('GREATER_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => a >= b})
	.set('LESS', {unary: false, types: ['number'], predicate: (a, b) => a < b})
	.set('LESS_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => a <= b})
	.set('EQUALS', {unary: false, types: ['string', 'number', 'boolean'], predicate: (a, b) => a == b})
	.set('NOT_EQUALS', {unary: false, types: ['string', 'number', 'boolean'], predicate: (a, b) => a != b})
	.set('CONTAINS', {unary: false, types: ['string'], predicate: (a, b) => a.contains(b)})
	.set('STARTS_WITH', {unary: false, types: ['string'], predicate: (a, b) => a.startsWith(b)})
	.set('ENDS_WITH', {unary: false, types: ['string'], predicate: (a, b) => a.endsWith(b)});

class TemplateTable {
	data;
	dataPath;

	constructor(path) {
		this.dataPath = JSONPathBuilder.from(path);
		Hooks.once('ready', () => this.init());
	}

	init() {
		this.data = deepClone(this.dataPath.traverse(game.system.template.Tables));
		return this.data;
	}

}

class PrerequisiteLoader {
	static load({prerequisites}) {
		const transformed = {}
		Object.entries(prerequisites).forEach(([key, prerequisiteData]) => {
				const title = game.i18n.localize(prerequisiteData.title);
				const Type = prerequisiteClassNameToClass(prerequisiteData.class)
				const subTypes = PrerequisiteLoader.loadSubTypes(Type, prerequisiteData);
				transformed[key] = {title, subTypes, class:prerequisiteData.class};
			}
		);
		return transformed;
	}

	static loadSubTypes(Type, prerequisiteData) {
		const subType = Type.subType;
		if (subType === 'item') {
			return PrerequisiteLoader.loadItemSubType(Type, prerequisiteData.itemBaseTypes)
		} else if (subType === 'actor') {
			return PrerequisiteLoader.loadActorSubType(prerequisiteData.paths)
		}
	}
	static loadActorSubType(paths) {
		const transformed = {}
		Object.entries(paths).forEach(([key, actorPath]) => {
			const path = actorPath.path;
			const title = game.i18n.localize(actorPath.title);
			const valueTypes = actorPath.valueTypes;
			const qualifiers = PrerequisiteLoader.loadQualifiers(valueTypes);
			transformed[key] = {title, qualifiers, path}; // we don't use path in the UI, instead we rely on the key,
			// this future proofs migration. We do need the path in our logic however.
		});
		return transformed;
	}

	static loadItemSubType(Type, itemBaseTypes) {
		const transformed = {}
		const criteria = {itemBaseTypes, typed: true, sortItems: true};
		const items = PrimeItemManager.getItems(criteria);
		items.forEach(item => {
			const valueTypes = Type.supportedValueTypes(item);
			const qualifiers = PrerequisiteLoader.loadQualifiers(valueTypes);
			const key = item.id; // this will become sourceKey for embedded items.
			const title = game.i18n.localize(item.name);
			transformed[key] = {title, qualifiers};
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

class Perks extends TemplateTable {
	_prerequisites;

	constructor() {
		super('perks')
	}

	init() {
		super.init();
		this._prerequisites = PrerequisiteLoader.load(this.data);
	}

	get prerequisites() {
		return this._prerequisites;
	}

	get defaultPrerequisite() {
		const [type, prerequisite] = Object.entries(this._prerequisites).shift();
		const [target, subType] = Object.entries(prerequisite.subTypes).shift();
		const [qualifier,] = Object.entries(subType.qualifiers).shift()
		const value = '';
		return {type, target, qualifier, value};
	}

	isUnaryQualifier({qualifier}){
		return (QUALIFIERS.get(qualifier) || {unary:true}).unary;
	}

}

export default class ItemConstants {
	static perks = new Perks();
}