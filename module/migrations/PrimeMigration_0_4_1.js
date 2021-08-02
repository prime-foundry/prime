import Migration from "./Migration.js";
import {PrimeItemManager} from "../item/PrimeItemManager.js";
import {isString} from "../util/support.js";

const PRIME_MAP = new Map([
	['att', 'Attune'],
	['end', 'Endurance'],
	['int', 'Intellect'],
	['itr', 'Intricate'],
	['man', 'Manipulation'],
	['mov', 'Manoeuvre'],
	['per', 'Perception'],
	['por', 'Portent'],
	['res', 'Resolve'],
	['str', 'Strength']]);

const REFINEMENT_MAP = new Map([
["animal", undefined],
["artistic", undefined],
["vehicle", undefined],
["survival", undefined],
["athletic", ['Athletic']],
["craft", ['Lock Picking','Alchemy']],
["melee", ['Melee']],
["ranged", ['Ranged']],
["stealth", ['Stealth']],
["tolerance", ['Tolerance']],
["bravery", ['Bravery']],
["deceive", ['Deceive']],
["influence", ['Influence']],
["knowledge", ['Culture (...)']],
["obscura", ['Observe']],
["observe", ['Observe']],
["recover", ['Recover','Meditate']],
["willpower", ['Willpower']],
["conduit", ['Manifest']],
["fury", ['Fury']],
["manifest", ['Manifest']],
["premonition", ['Premonition']],
["regeneration", ['Regenerate']],
["tap", ['Manifest']],
["threads", ['Threads']]]);

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
		const primeItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'prime'});
		const refinementItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'refinement'});
		const actors =  game.actors.contents;

		for (const actorDoc of actors) {
			const foundryData = actorDoc.data;
			const gameSystemData = foundryData.data;
			const actor = actorDoc.dyn.typed;
			let itemsToEmbed = [];
			PrimeMigration_0_4_1.migrateNotes(gameSystemData);


			if (primeItems.length > 0 && actorDoc.itemTypes['prime'].length === 0) {
				itemsToEmbed = itemsToEmbed.concat(PrimeMigration_0_4_1.migratePrimes(actorDoc, actor, gameSystemData, primeItems));
			}
			if (refinementItems.length > 0 && actorDoc.itemTypes['refinement'].length === 0) {
				itemsToEmbed = itemsToEmbed.concat(PrimeMigration_0_4_1.migrateRefinements(actorDoc, actor, gameSystemData, refinementItems));
			}

			await foundryData.update(foundry.utils.deepClone(foundryData), {render: false});

			if(itemsToEmbed.length > 0) {
				const updatedActor = await game.actors.get(actorDoc.id);
				await updatedActor.createEmbeddedDocuments("Item", itemsToEmbed);
				await updatedActor.update(undefined, {render: false});
			}
		}
	}

	static migrateNotes( gameSystemData) {
		if(isString(gameSystemData.notes) ){
			gameSystemData.notes = {core:gameSystemData.notes || ''};
		}
	}

	static migratePrimes(actorDoc, actor, gameSystemData, primeItems) {

		if (gameSystemData.primes != null) {
			const primesToEmbed = [];
			for (const [key, oldPrime] of Object.entries(gameSystemData.primes)) {
				const name = PRIME_MAP.get(key)
				const newPrime =  primeItems.find(item => item.name == name);
				if(newPrime != null && !(newPrime.data.metadata.default === false && oldPrime.value === 0)) {
					const primeFoundryData = foundry.utils.deepClone(newPrime);
					const primeGameSystem = primeFoundryData.data;
					primeGameSystem.value = oldPrime.value;
					primesToEmbed.push(primeFoundryData);
				}
			}
			if(primesToEmbed.length > 0){
				return primesToEmbed;
			}
			gameSystemData.primes = null;
		}
		return [];
	}

	static migrateRefinements(actorDoc, actor, gameSystemData, refinementItems) {
		if (gameSystemData.refinements != null) {
			const refinementsToEmbed = new Map();
			let migrationText = '\n'
			for (const [key, oldRefinement] of Object.entries(gameSystemData.refinements)) {
				const names = REFINEMENT_MAP.get(key);
				if(names == null){
					migrationText = `${migrationText}
<br>⇄ Unable to Migrate Refinement: ${key}:${oldRefinement.value}`;
				} else {
					for(const name of names){
						if(refinementsToEmbed.has(name)){
							const refinementFoundryData = refinementsToEmbed.get(name);
							const refinementGameSystem = refinementFoundryData.data;
							const currentValue = refinementGameSystem.value;
							if(currentValue < oldRefinement.value){
								refinementGameSystem.value = oldRefinement.value
								migrationText = `${migrationText}
<br>⇄ Migrated Refinement: ${key}:${oldRefinement.value} to ${name}:${refinementGameSystem.value} increasing value from ${currentValue} to match`;
							} else {
								migrationText = `${migrationText}
<br>⇄ Migrated Refinement: ${key}:${oldRefinement.value} to ${name}:${refinementGameSystem.value} will keep higher value`;
							}
						} else {
							const newRefinement =  refinementItems.find(item => item.name == name);
							if(newRefinement != null && !(newRefinement.data.metadata.default === false && oldRefinement.value === 0)) {
								const refinementFoundryData = foundry.utils.deepClone(newRefinement);
								const refinementGameSystem = refinementFoundryData.data;
								refinementGameSystem.value = oldRefinement.value;
								if(refinementFoundryData.name.startsWith('Culture') ) {
									const culture = actor.profile.birthplace
										|| actor.profile.celestial
										|| actor.profile.faction
										|| actor.profile.race
										|| '...';
									refinementFoundryData.name = refinementFoundryData.name.replace('...', culture);
								}
								refinementsToEmbed.set(name, refinementFoundryData);
								migrationText = `${migrationText}
<br>⇄ Migrated Refinement: ${key}:${oldRefinement.value} to ${name}:${refinementGameSystem.value}`;
							} else {
								migrationText = `${migrationText}
<br>⇄ Did Not Migrate Refinement: ${key}:${oldRefinement.value} to ${name}`;
							}
						}
					}
				}
			}
			if(refinementsToEmbed.size > 0){
				console.debug(migrationText);
				gameSystemData.notes.core = `${gameSystemData.notes.core}${migrationText}`
				return Array.from(refinementsToEmbed.values());
			}
			gameSystemData.refinements = null;
		}
		return [];
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