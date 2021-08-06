import Component from "../../util/Component.js";
import PrimeItemConstants from "../PrimeItemConstants.js";

export class Modifiers extends Component {

	get collection() {
		return (this.gameSystem.modifiers || []).map((modifier, index) => {
			return new Modifier(this, index);
		});
	}

	pathToModifiers() {
		return this.gameSystemPath.with('modifiers');
	}

	compactModifiers() {
		const compacted = this.gameSystem.modifiers.filter(modifier => modifier != null);
		this.write(this.pathToModifiers(), compacted);
	}

	add() {
		const modifier = PrimeItemConstants.perks.defaultModifier;
		this.write(this.pathToModifiers().with(this.gameSystem.modifiers.length), modifier);
	}

	modifierFor(target) {
		return this.collection.reduce((previous, modifier) => previous + modifier.modifierFor(target),0);
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