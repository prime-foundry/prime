import {PrimeItemManager} from "./item/PrimeItemManager.js";
import {Prerequisites} from "./item/components/Prerequisites.js";

const QUALIFIERS = new Map()
	.set('EXISTS', {unary: true, predicate: (a) => a != null})
	.set('MISSING', {unary: true, predicate: (a) => a == null})
	.set('GREATER', {unary: false, types: ['number'], predicate: (a, b) => a > b})
	.set('GREATER_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => a >= b})
	.set('LESS', {unary: false, types: ['number'], predicate: (a, b) => a < b})
	.set('LESS_OR_EQUALS', {unary: false, types: ['number'], predicate: (a, b) => a <= b})
	.set('EQUALS', {unary: false, types: ['string', 'number', 'boolean'], predicate: (a, b) => a == b})
	.set('NOT_EQUALS', {unary: false, types: ['string', 'number', 'boolean'], predicate: (a, b) => a != b})
	.set('CONTAINS', {unary: false, types: ['string'], predicate: (a, b) => a.contains(b)})
	.set('STARTS_WITH', {unary: false, types: ['string'], predicate: (a, b) => a.startsWith(b)})
	.set('ENDS_WITH', {unary: false, types: ['string'], predicate: (a, b) => a.endsWith(b)});

export class PrimeTables {

	/**
	 *
	 * @param {string} key
	 * @returns {{predicate: (function(*, *): boolean) | (function(*): boolean), unary: boolean, types: string[] | undefined}}
	 */
	static qualifierForKey(key) {
		return QUALIFIERS.get(key) || {unary: false, predicate: () => true};
	}

	static qualifiersForTypes(types) {
		let qualifiers = Array.from(QUALIFIERS.entries());
		if (types != null) {
			qualifiers = qualifiers.filter(([, qualifier]) => qualifier.types === undefined
				|| types.some(type => qualifier.types.includes(type)));
		}
		const transformed = qualifiers.map(([key,qualifier]) => ({key, requiresValue:!qualifier.unary ,title:game.i18n.localize(`PRIME.qualifier_key_${key}`)}));
		return transformed;
	}

	static perksTable(){
		const perksTable = PrimeTables.cloneTables("perks");
		const prerequisites = PrimeTables.prerequisiteTable(perksTable);
		perksTable.prerequisites = prerequisites; // overwrite for now until we have done the other bits.
		return perksTable;
	}

	static prerequisiteTable({prerequisites}) {
		return prerequisites.map(prerequisite => {
			const key = prerequisite.key;
			const title = game.i18n.localize(prerequisite.title);
			const subTypes = PrimeTables.loadPrerequisiteSubTypes(prerequisite.subTypes, key)
			return {key, title, subTypes}
		});
	}

	static loadPrerequisiteSubTypes(subTypes, type) {
		const subType = subTypes.type;
		if (subType === 'stat' || subType === 'item') {
			const criteria = {itemBaseTypes: subTypes.itemBaseTypes, typed: true};
			const items = PrimeItemManager.getItems(criteria);
			const prerequisiteClass = Prerequisites.prerequisiteClassForType(subType);
			const valueTypes = prerequisiteClass.supportedValueTypes();
			const qualifiers = PrimeTables.qualifiersForTypes(valueTypes);
			return items.map(item => {
				const target = item.id; // this will become sourceKey for embedded items.
				const title = game.i18n.localize(item.name);
				return {type, subType, target, title, qualifiers, valueTypes};
			});
		} else if (subType === 'actor') {
			return subTypes.actorPaths.map(actorPath => {
				const target = actorPath.at;
				const title = game.i18n.localize(actorPath.title);
				const valueTypes = actorPath.valueTypes;
				const qualifiers = PrimeTables.qualifiersForTypes(valueTypes);
				return {type, subType, target, title, qualifiers, valueTypes};
			});
		}
		return [];
	}

	static cloneAndTranslateTables(whatPath) {
		var tableClone = this.cloneTables(whatPath);
		this.addTranslations(tableClone);

		return tableClone;
	}

	static cloneTables(path) {
		var pathSplit = path.split(".");
		var count = 0;
		var currTable = game.system.template.Tables
		while (count < pathSplit.length) {
			var currPathSplit = pathSplit[count];
			if (currTable[currPathSplit]) {
				currTable = currTable[currPathSplit]
			} else {
				console.error("ERROR: Unable to find the table reference. path: '" + path + "', failed portion: '" + currPathSplit + "'. Base table data: ", game.system.template.Tables)
			}
			count++;
		}

		if (Array.isArray(currTable)) {
			return $.extend(true, [], currTable);
		} else {
			return $.extend(true, {}, currTable);
		}
	}

	static addTranslations(whatData) {
		for (var key in whatData) {
			if (whatData[key].indexOf) {
				var _primeDataIndex = whatData[key].indexOf("PRIME.");
			}

			if (key == "title" || key == "description" || _primeDataIndex === 0) {
				var translation = game.i18n.localize(whatData[key]);
				whatData[key] = translation;
			}
			if (typeof whatData[key] === 'object' && whatData[key] !== null) {
				this.addTranslations(whatData[key]);
			}
			_primeDataIndex = false;
		}
	}

	static getTitleFromTableByKey(key, path) {
		let table = PrimeTables.cloneTables(path);
		let count = 0;
		while (count < table.length) {
			let entry = table[count];
			if (entry.key == key) {
				return game.i18n.localize(entry.title);
			}
			count++;
		}
		console.error("ERROR: Unable to find an entry with the key of '" + key + "' in: ", table);
		return "";
	}

	static getTitlesFromTableByCheckboxGroupArray(checkboxGroupArray, path) {
		var titlesArray = [];
		var table = PrimeTables.cloneAndTranslateTables(path);

		if (checkboxGroupArray.length != table.length) {
			console.warn("WARNING: Mismatched lengths between checkbox group array and data table.", checkboxGroupArray, table);
		}

		var count = 0;
		while (count < checkboxGroupArray.length) {
			if (checkboxGroupArray[count]) {
				let entry = table[count];
				titlesArray.push("<span title='" + entry.description + "' class='hasTooltip'>" + entry.title + "</span>");
			}
			count++;
		}

		if (titlesArray.length == 0) {
			titlesArray.push("None");
		}
		return titlesArray.join(", ");
	}

	static getPrimeKeysAndTitles() {
		const basePrimeData = game.system.template.Actor.templates.primes_template.primes;
		const keyTitleArray = this.getKeyAndTitleData(basePrimeData);

		return keyTitleArray;
	}

	static getRefinementKeysAndTitles() {
		const baseRefinementsData = game.system.template.Actor.templates.refinements_template.refinements;
		const keyTitleArray = this.getKeyAndTitleData(baseRefinementsData);

		return keyTitleArray;
	}

	static getKeyAndTitleData(whatKeyIndexedData) {
		let keyTitleArray = [];
		let currEntry = null;
		for (let key in whatKeyIndexedData) {
			currEntry = whatKeyIndexedData[key];
			keyTitleArray.push({key: key, title: game.i18n.localize(currEntry.title)});
		}
		return keyTitleArray;
	}

	static getActionKeysAndTitles(omitDefaultActions, allowedActionTypesArray) {
		var actions = this.getItemKeysAndTitlesByType("action");
		if (omitDefaultActions || allowedActionTypesArray) {
			var returnActions = []
			var count = 0;
			while (count < actions.length) {
				var currAction = actions[count];
				if (((omitDefaultActions && !currAction.source.data.data.default) || !omitDefaultActions) && (!allowedActionTypesArray || allowedActionTypesArray.indexOf(currAction.source.data.data.type) > -1)) {
					returnActions.push(currAction);
				}
				count++;
			}
			return returnActions;
		}
		return actions;
	}

	static getItemKeysAndTitlesByType(typeFilter) {
		var matchingItems = []
		if (ItemDirectory && ItemDirectory.collection)	// Sometimes not defined when interegated.
		{
			ItemDirectory.collection.forEach((item, key, items) => {
				if (item.type == typeFilter || typeFilter == "*") {
					if (item.data.data.sourceKey) {
						matchingItems.push({key: item.data.data.sourceKey, title: item.name, source: item});
					} else {
						matchingItems.push({key: key, title: item.name, source: item});
					}
				}
			});
		}

		return matchingItems;
	}
}