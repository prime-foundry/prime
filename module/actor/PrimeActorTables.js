
import PrimeTables from "../PrimeTables.js";
import {loadBasicData, loadComplexData, TemplateTable} from "../util/TemplateTable.js";
import {arrayIfNot} from "../util/support.js";
import {PrimeItemManager} from "../item/PrimeItemManager.js";

class ActorTable extends TemplateTable {
	_mentalConditions;
	_woundConditions;

	constructor() {
		super('actor')
	}

	itemRefresh() {
		this._mentalConditions = null;
		this._woundConditions = null;
	}

	get woundConditions() {
		if (this._woundConditions == null) {
			this._woundConditions = ActorTable.loadInjuriesForType('wound');
		}
		return this._woundConditions;
	}

	get mentalConditions() {
		if (this._mentalConditions == null) {
			this._mentalConditions = ActorTable.loadInjuriesForType('insanity');
		}
		return this._mentalConditions;
	}

	static loadInjuriesForType(injuryType) {
		const transformed = {}
		const filtersData = {injuryType};
		const criteria = {itemBaseTypes:'injury', typed: true, sortItems: true, filtersData};
		const items = PrimeItemManager.getItems(criteria);
		items.forEach(item => {
			const key = item.id; // this will become sourceKey for embedded items.
			const title = game.i18n.localize(item.name);
			const description = item.descriptions.core;
			transformed[key] = {title, description};
		});
		return transformed;
	}
}

export default class PrimeActorTables {
	static _actor = new ActorTable();

	static get woundConditions() {
		return this._actor.woundConditions;
	}
	static get mentalConditions() {
		return this._actor.mentalConditions;
	}
	static get lookups() {
		return PrimeTables.lookups.actor;
	}
}