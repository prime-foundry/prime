import Component from "../../util/Component.js";
import {PrimeItemManager} from "../PrimeItemManager.js";
import JSONPathBuilder from "../../util/JSONPathBuilder.js";

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
}

class Effects extends Component {
	constructor(parent) {
		super(parent);
	}
}
const UNARY_QUALIFIERS = new Map()
	.set('has', (a) => a != null)
	.set("hasn't", (a) => a == null);

const BINARY_QUALIFIERS = new Map()
	.set('>', (a,b) => a > b)
	.set('>=', (a,b) => a >= b)
	.set('<', (a,b) => a < b)
	.set('<=', (a,b) => a <= b)
	.set('==', (a,b) => a == b)
	.set('!=', (a,b) => a != b);

export class Bonus extends Effect {

}

/**
 * Technicaly if we want prerequisites could be a nested array or prerequisites.
 */
export class Prerequisites extends Component {
	get prerequisites() {
		return [];
	}

	qualifies() {
		// every returns true only if all pass the passed predicate, but will return false, the moment one fails.
		return this.prerequisites.every(prerequisite => prerequisite.qualifies());
	}
}

class Prerequisite extends Effect {

	qualifies() {
		return this.document.isEmbedded();
	}

	getOwner() {
		return this.document.parent;
	}

	get qualifier(){
		return UNARY_QUALIFIERS.keys()[0];
	}
}

/**
 * Prerequisites based on embedded items. The target value should be the source key, and not the id of the embedded item.
 *
 * Makes the presumption that if using binary qualifiers, there is a value contained within it.
 *
 * Unary Support (has and hasn't)
 *   All Embedded Items
 * Binary Support (value comparisons)
 *   Prime
 *   Refinement
 */
export class ItemPrerequisite extends Prerequisite {

	qualifies() {
		if (super.qualifies()) {
			const actorDoc = this.document.parent;
			const criteria = {
				itemCollection: actorDoc.items,
				typed: true,
				filtersData: {metadata: {sourceKey: this.target}}
			};

			const item = PrimeItemManager.getItems(criteria)[0];
			let qualifier = UNARY_QUALIFIERS.get(this.qualifier);
			if(qualifier != null){
				return qualifier(item);
			}
			qualifier = BINARY_QUALIFIERS.get(this.qualifier);
			if(qualifier != null){
				const itemAmount = item.value;
				return qualifier(itemAmount, this.value);
			}
			// nothing to qualify.
			return true;

		}
		return false;
	}
}
export class ActorPrerequisite extends Prerequisite {

	qualifies() {
		if (super.qualifies()) {
			const actorDoc = this.document.parent;
			const path = JSONPathBuilder.from(this.target);
			const object = path.traverse(actorDoc);

			let qualifier = UNARY_QUALIFIERS.get(this.qualifier);
			if(qualifier != null){
				return qualifier(object);
			}
			qualifier = BINARY_QUALIFIERS.get(this.qualifier);
			if(qualifier != null){
				return qualifier(object, this.value);
			}
			return true;
		}
		return false;
	}
}