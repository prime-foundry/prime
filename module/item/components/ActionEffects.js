import Component from "../../util/Component.js";
import PrimeItemTables from "../PrimeItemTables.js";

export class ActionEffects extends Component {

	get collection() {
		return Array.from(this.gameSystem.actionEffects || []).map((actionEffects, index) => {
			return new ActionEffect(this, index);
		});
	}

	pathToActionEffects() {
		return this.gameSystemPath.with('actionEffects');
	}

	compactActionEffects() {
		const compacted = Array.from(this.gameSystem.actionEffects || []).filter(actionEffects => actionEffects != null);
		this.write(this.pathToActionEffects(), compacted);
	}

	add() {
		const actionEffects = PrimeItemTables.defaultActionEffect;
		this.write(this.pathToActionEffects().with((this.gameSystem.actionEffects || []).length || 0), actionEffects);
	}

	* [Symbol.iterator]() {
		yield * this.collection;
	}
}

export class ActionEffect extends Component {
	index;

	constructor(parent, index) {
		super(parent);
		this.index = index;
	}

	get type() {
		return this.getActionEffectData().type;
	}

	set type(type) {
		this.write(this.pathToActionEffect().with('type'), type);
	}

	get target() {
		return this.getActionEffectData().target;
	}

	set target(target) {
		this.write(this.pathToActionEffect().with('target'), target)
	}

	get value() {
		return this.getActionEffectData().value;
	}

	set value(value) {
		this.write(this.pathToActionEffect().with('value'), value)
	}

	getActionEffectData() {
		return this.gameSystem.actionEffects[this.index] || {};
	}

	pathToActionEffect() {
		return this.parent.pathToActionEffects().with(this.index);
	}

	delete() {
		this.write(this.pathToActionEffect(), null);
		this.parent.compactActionEffects();
	}

}