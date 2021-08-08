import JSONPathBuilder from "./JSONPathBuilder.js";

export class TemplateTable {
	data;
	dataPath;

	constructor(path) {
		this.dataPath = JSONPathBuilder.from(path);
		Hooks.once('ready', () => this.init());
	}

	init() {
		/*
		 * deepClone is on the Global Scope
		 * defined: FoundryVTT/resources/app/common/utils/helpers.mjs
		 * api: https://foundryvtt.com/api/module-helpers.html#.deepClone
		 */
		this.data = deepClone(this.dataPath.traverse(game.system.template.Tables));
		return this.data;
	}

}