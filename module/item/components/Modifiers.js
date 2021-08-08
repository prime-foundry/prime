import Component from "../../util/Component.js";
import PrimeItemConstants from "../PrimeItemConstants.js";

export class Modifiers extends Component {

	get collection() {
		return Array.from(this.gameSystem.modifiers || []).map((modifier, index) => {
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

	modifierFor(target) {
		return this.collection.reduce((previous, modifier) => previous + modifier.modifierFor(target),0);
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

	modifierFor(target){
		if(this.target !== target){
			return 0;
		}
		return this.value;
	}

	static get subType(){
		return undefined;
	}
}