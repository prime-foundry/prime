import JSONPathBuilder from "./JSONPathBuilder.js";

export class TemplateTable {
	data;
	dataPath;

	constructor(path) {
		this.dataPath = JSONPathBuilder.from(path);
		Hooks.once('ready', () => this.init());
	}

	init() {
		this.data = deepClone(this.dataPath.traverse(game.system.template.Tables));
		return this.data;
	}

}