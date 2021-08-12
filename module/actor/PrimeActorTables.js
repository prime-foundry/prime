
import PrimeTables from "../PrimeTables.js";
import {loadBasicData, TemplateTable} from "../util/TemplateTable.js";

class ActorTable extends TemplateTable {
	_mentalConditions;
	constructor() {
		super('actor')
	}
	get woundConditions() {
		if (this._woundConditions == null) {
			this._woundConditions = loadBasicData(this.data.woundConditions);
		}
		return this._woundConditions;
	}
	get mentalConditions() {
		if (this._mentalConditions == null) {
			this._mentalConditions = loadBasicData(this.data.mentalConditions);
		}
		return this._mentalConditions;
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