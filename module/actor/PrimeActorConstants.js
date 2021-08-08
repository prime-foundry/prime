import {TemplateTable} from "../util/TemplateTable.js";
import {arrayIfNot} from "../util/support.js";

class ActorStats extends TemplateTable{
	_lookups;
	constructor() {
		super('actor');
	}

	get lookups() {
		if(this._lookups == null) {
			this._lookups = ActorStats.loadLookups(this.data);
		}
		return this._lookups;
	}

	static loadLookups({actorStatLookups}) {
		const transformed = {};
		Object.entries(actorStatLookups).forEach(([key, lookupData]) => {
				const title = game.i18n.localize(lookupData.title);
				const valueTypes = arrayIfNot(lookupData.valueTypes) ;
				const modifiable = !!lookupData.modifiable;
				const path = lookupData.path || key;
				transformed[key.replaceAll('.', '_')] = {title, valueTypes, path, modifiable};
			}
		);
		return transformed;
	}
}

export default class PrimeActorConstants {
	static stats = new ActorStats();
}