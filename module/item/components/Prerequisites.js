import Component from "../../util/Component.js";
import {PrimeItemManager} from "../PrimeItemManager.js";
import JSONPathBuilder from "../../util/JSONPathBuilder.js";
import {PrimeTables} from "../../prime_tables.js";
import ItemConstants from "../ItemConstants.js";

export class Prerequisites extends Component {

	get collection() {
		return (this.gameSystem.prerequisites || []).map((prerequisite, index) => {
			const PrerequisiteType = Prerequisites.prerequisiteClassForType(prerequisite.type);
			return new PrerequisiteType(this, index);
		});
	}

	pathToPrerequisites() {
		return this.gameSystemPath.with('prerequisites');
	}

	compactPrerequisites() {
		const compacted = this.gameSystem.prerequisites.filter(prereq => prereq != null);
		this.write(this.pathToPrerequisites(), compacted);
	}

	add() {
		const prerequisite = ItemConstants.perks.defaultPrerequisite;
		this.write(this.pathToPrerequisites().with(this.gameSystem.prerequisites.length), prerequisite);
	}

	qualifies() {
		// every returns true only if all pass the passed predicate, but will return false, the moment one fails.
		return this.prerequisites.every(prerequisite => prerequisite.qualifies());
	}

	static prerequisiteClassForType(type){
		return PREREQUISITE_CLASSES.get(ItemConstants.perks.prerequisites[type].class);
	}
}

export class Prerequisite extends Component {
	index;

	constructor(parent, index) {
		super(parent);
		this.index = index;
	}

	get type() {
		return this.getPrerequisiteData().type;
	}

	set type(type) {
		this.write(this.pathToPrerequisite().with('type'), type);
	}

	get target() {
		return this.getPrerequisiteData().target;
	}

	set target(target) {
		this.write(this.pathToPrerequisite().with('target'), target)
	}

	get value() {
		return this.getPrerequisiteData().value;
	}

	set value(value) {
		this.write(this.pathToPrerequisite().with('value'), value)
	}

	get qualifier() {
		return this.getPrerequisiteData().qualifier;
	}

	set qualifier(qualifier) {
		this.write(this.pathToPrerequisite().with('qualifier'), qualifier)
	}


	qualifies() {
		return this.document.isEmbedded();
	}

	getPrerequisiteData() {
		return this.gameSystem.prerequisites[this.index] || {};
	}

	pathToPrerequisite() {
		return this.parent.pathToPrerequisites().with(this.index);
	}

	delete() {
		this.write(this.pathToPrerequisite(), null);
		this.parent.compactPrerequisites();
	}
	static supportedValueTypes() {
		return undefined;
	}

	static get subType(){
		return undefined;
	}
}

export class ItemPrerequisite extends Prerequisite {

	get sourceKey() {
		return this.target;
	}

	qualifies() {
		if (super.qualifies()) {
			const actorDoc = this.document.parent;
			const criteria = {
				itemCollection: actorDoc.items,
				typed: true,
				filtersData: {metadata: {sourceKey: this.sourceKey}}
			};

			const item = PrimeItemManager.getItems(criteria)[0];
			const qualifier = PrimeTables.qualifierForKey(this.qualifier);
			return qualifier.unary ? qualifier.predicate(item) : this.qualifyItemValues(qualifier, item);
		}
		return false;
	}

	static supportedValueTypes(item) {
		return ['object'];
	}

	qualifyItemValues(qualifier) {
		return true;
	}

	static get subType(){
		return 'item';
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
export class ItemValuePrerequisite extends ItemPrerequisite {

	static supportedValueTypes(item) {
		if(item.metadata.default){
			return ['number'];
		} else {
			return ['object', 'number'];
		}
	}

	qualifyItemValues(qualifier, item) {
		return qualifier.predicate(item.value, this.value);
	}
}

export class ItemNamePrerequisite extends ItemPrerequisite {

	static supportedValueTypes(item) {
		if(item.metadata.default){
			return ['string'];
		} else {
			return ['object', 'string'];
		}
	}

	qualifyItemValues(qualifier, item) {
		return qualifier.predicate(item.name, this.value);
	}
}

export class ItemValueOrNamePrerequisite extends ItemPrerequisite {

	static supportedValueTypes(item) {
		const valueTypes = ['number'];
		if(!item.metadata.default){
			valueTypes.push('object');
		}
		if(item.metadata.customisable) {
			valueTypes.push('string');
		}
		return valueTypes;
	}

	qualifyItemValues(qualifier, item) {
		let result = qualifier.predicate(item.value, this.value);
		if(item.metadata.customisable) {
			result = result || qualifier.predicate(item.name, this.value);
		}
		return result;
	}
}

export class ActorPrerequisite extends Prerequisite {

	qualifies() {
		if (super.qualifies()) {
			const actorDoc = this.document.parent;
			const path = JSONPathBuilder.from(this.target);
			const object = path.traverse(actorDoc);

			const qualifier = PrimeTables.qualifierForKey(this.qualifier);
			return qualifier.unary ? qualifier.predicate(object) : qualifier.predicate(object, this.value);
		}
		return false;
	}

	static get subType(){
		return 'actor';
	}

}

const PREREQUISITE_CLASSES = new Map()
	.set('ItemValueOrNamePrerequisite', ItemValueOrNamePrerequisite)
	.set('ItemNamePrerequisite', ItemNamePrerequisite)
	.set('ItemValuePrerequisite', ItemValuePrerequisite)
	.set('ItemPrerequisite', ItemPrerequisite)
	.set('ActorPrerequisite', ActorPrerequisite);

export function prerequisiteClassNameToClass(className) {
	return PREREQUISITE_CLASSES.get(className);
}