import Component from "../../util/Component.js";

class Effect extends Component {
	get type() {
		// many types, primes,refinements, etc etc.
		return '';
	}

	set type(type) {

	}

	get target() {
		return ''; // could be an item/component (on creation would be source item, but on use the embedded item),
		// or another data point such as an action,
		// I think the best thing is to either use the JSONPathBuilder tool, or in the case of an item, source key lookup.
		// with effects this is an addition or subtraction
		// with prerequisites its a form of validation.
		// Possibly with prerequisites we have an additional field talking about minimum and maximum,
		// or in the case of other perks, has and hasn't.
	}

	set target(type) {

	}

	get value() {
		return 0;
	}

	set value(value) {

	}

	get valueType() {
		return 'number'; //will be variable depending on value chosen.
	}

	set valueType(valueType) {

	}
}

class Effects extends Component {
	constructor(parent) {
		super(parent);
	}
}