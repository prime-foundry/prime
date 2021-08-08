import Component from "../../util/Component.js";
import PrimeItemConstants from "../PrimeItemConstants.js";

export class Modifiers extends Component {

	get collection() {
		return Array.from(this.gameSystem.modifiers || []).map((modifier, index) => {

			const modifierCategory = (PrimeItemConstants.modifiers[modifier.type] || {}).category;
			if(modifierCategory === 'otherItem'){
				return new OtherItemModifier(this, index);
			}
			return new Modifier(this, index);
		});
	}

	pathToModifiers() {
		return this.gameSystemPath.with('modifiers');
	}

	compactModifiers() {
		const compacted = Array.from(this.gameSystem.modifiers || []).filter(modifier => modifier != null);
		this.write(this.pathToModifiers(), compacted);
	}

	add() {
		const modifier = PrimeItemConstants.defaultModifier;
		this.write(this.pathToModifiers().with((this.gameSystem.modifiers || []).length || 0), modifier);
	}

	modifierFor(actorDoc, ownedItem, target, options ={}) {
		return this.collection.reduce((previous, modifier) => previous + modifier.modifierFor(actorDoc, ownedItem, target, options),0);
	}

	* [Symbol.iterator]() {
		yield * this.collection;
	}
}

export class Modifier extends Component {
	index;

	constructor(parent, index) {
		super(parent);
		this.index = index;
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
		this.write(this.pathToModifier().with('target'), target)
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

	get rules_path(){
		return this.pathToModifier().with('rules');
	}


	getModifierData() {
		return this.gameSystem.modifiers[this.index] || {};
	}

	pathToModifier() {
		return this.parent.pathToModifiers().with(this.index);
	}

	delete() {
		this.write(this.pathToModifier(), null);
		this.parent.compactModifiers();
	}

	modifierFor(actorDoc, ownedItem, target, options ={}){

		const {includeSituational = false, includeUnequipped=false} = options
		if(this.target !== target){
			return 0;
		}
		if(!includeSituational && this.situational){
			return 0;
		}
		if((!includeUnequipped && this.equipped) && !ownedItem.equipped) {
			return 0;
		}
		return this.value;
	}
}
export class OtherItemModifier extends Modifier {

	constructor(parent, index) {
		super(parent, index);
	}

	modifierFor(actorDoc, ownedItem, target, options ={}){
		const {qualifies = true, includeSituational = false, includeUnequipped = false} = options

		if(this.target !== target){
			return 0;
		}
		if(!includeSituational && this.situational){
			return 0;
		}
		if((!includeUnequipped && this.equipped) && !ownedItem.equipped) {
			return 0;
		}

		const itemDoc = ItemDirectory.collection.get(target);
		const item = itemDoc.dyn.typed;
		if(qualifies && !item.prerequisites.qualifies(actorDoc, ownedItem)){
			return 0;
		}
		return item.modifiers.modifierFor(actorDoc, ownedItem, target, options);
	}
}