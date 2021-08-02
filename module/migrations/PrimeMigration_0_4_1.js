import Migration from "./Migration.js";
import {PrimeItemManager} from "../item/PrimeItemManager.js";

export default class PrimeMigration_0_4_1 extends Migration {
	static get version() {
		return '0.4.1';
	}

	static async migrate() {
		const items = game.items.contents;
		for (const item of items) {
			await PrimeMigration_0_4_1.migrateItem(item);
		}
		await PrimeMigration_0_4_1.migrateActors();

		return true;
	}

	static async migrateActors() {
		const actors = game.actors.contents;
		const primeItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'prime'});
		const refinementItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'refinement'});

		for (const actorDoc of actors) {
			const foundryData = actorDoc.data;
			const gameSystemData = foundryData.data;
			const actor = actorDoc.dyn.typed;
			let hasEmbedded = false;
			if (primeItems.length > 0 && PrimeItemManager.getItems(
				{itemCollection: actor.items, matchAll: false, itemBaseTypes: 'prime', filtersData:{parent:undefined}})
				.length === 0) {
				hasEmbedded = true;
				await PrimeMigration_0_4_1.migratePrimes(actorDoc, actor, gameSystemData, primeItems);
			}
			if (refinementItems.length > 0) {
				hasEmbedded = true;
				await PrimeMigration_0_4_1.migrateRefinements(actorDoc, actor, gameSystemData, refinementItems);
			}
			if (hasEmbedded) {
				await actorDoc.update(undefined,{render: false});
			}
		}
	}

	static async migratePrimes(actorDoc, actor, gameSystemData, primeItems) {

		if (gameSystemData.primes != null) {
			const primesToEmbed = [];
			for (const [key, oldPrime] of Object.entries(gameSystemData.primes)) {
				let newPrime = null;
				switch (key) {
					case 'att':
						newPrime = primeItems.find(item => item.name == 'Attune');
						break;
					case 'end':
						newPrime = primeItems.find(item => item.name == 'Endurance');
						break;
					case 'int':
						newPrime = primeItems.find(item => item.name == 'Intellect');
						break;
					case 'itr':
						newPrime = primeItems.find(item => item.name == 'Intricate');
						break;
					case 'man':
						newPrime = primeItems.find(item => item.name == 'Manipulation');
						break;
					case 'mov':
						newPrime = primeItems.find(item => item.name == 'Manoeuvre');
						break;
					case 'per':
						newPrime = primeItems.find(item => item.name == 'Perception');
						break;
					case 'por':
						newPrime = primeItems.find(item => item.name == 'Portent');
						break;
					case 'res':
						newPrime = primeItems.find(item => item.name == 'Resolve');
						break;
					case 'str':
						newPrime = primeItems.find(item => item.name == 'Strength');
						break;
				}
				const primeFoundryData = foundry.utils.deepClone(newPrime);
				const primeGameSystem = primeFoundryData.data;
				primeGameSystem.metadata = primeGameSystem.metadata  || {};
				primeGameSystem.metadata.sourceKey = newPrime.id;
				primeGameSystem.value = oldPrime.value;
				primesToEmbed.push(primeFoundryData);
			}
			await actorDoc.createEmbeddedDocuments("Item", primesToEmbed)
		}
	}

	static async migrateRefinements(actorDoc, actor, gameSystemData, refinementItems) {

	}

	static async migrateItem(itemDoc) {
		const foundryData = itemDoc.data;
		const gameSystemData = foundryData.data;
		const item = itemDoc.dyn.typed;
		PrimeMigration_0_4_1.migrateAudit(item, gameSystemData);
		PrimeMigration_0_4_1.migrateValuable(item, gameSystemData);
		PrimeMigration_0_4_1.migrateDescriptions(item, gameSystemData);
		PrimeMigration_0_4_1.migrateMetadata(item, gameSystemData);

		await foundryData.update(foundry.utils.deepClone(foundryData), {render: false});
	}

	static migrateValuable(item, gameSystemData) {
		if (gameSystemData.valueType != null) {
			item.value.type = gameSystemData.valueType;
			gameSystemData.valueType = null;
		}
		if (gameSystemData.valueAmount != null) {
			item.value.amount = gameSystemData.valueAmount;
			gameSystemData.valueAmount = null;
		}
	}

	static migrateMetadata(item, gameSystemData) {
		if (gameSystemData.setting != null) {
			item.metadata.setting = gameSystemData.setting;
			gameSystemData.setting = null;
		}
		if (gameSystemData.default != null) {
			item.metadata.default = gameSystemData.default;
			gameSystemData.default = null;
		}
		if (gameSystemData.customisable != null) {
			item.metadata.customisable = gameSystemData.customisable;
			gameSystemData.customisable = null;
		}
	}

	static migrateDescriptions(item, gameSystemData) {
		if (gameSystemData.settingDescription) {
			item.descriptions.setting = gameSystemData.settingDescription;
		}
		gameSystemData.settingDescription = null;
		if (gameSystemData.description) {
			item.descriptions.core = gameSystemData.description;
		}
		gameSystemData.description = null;
	}

	static migrateAudit(item, gameSystemData) {
		if (item.audit.setCreationAuditIfMissing(gameSystemData.creator, gameSystemData.creatorID, gameSystemData.created)) {
			item.audit.appendUpdatedAudit(gameSystemData.creator, gameSystemData.creatorID, gameSystemData.created);
			item.audit.appendUpdatedAudit(gameSystemData.updater, gameSystemData.updaterID, gameSystemData.updated);
			if (gameSystemData.updater != null) {
				// we have modified the item so we append an audit item.
				item.audit.appendUpdatedAudit();
			}
		}
		gameSystemData.creator = null;
		gameSystemData.creatorID = null;
		gameSystemData.created = null;
		gameSystemData.updater = null;
		gameSystemData.updaterID = null;
		gameSystemData.updated = null;
	}
}