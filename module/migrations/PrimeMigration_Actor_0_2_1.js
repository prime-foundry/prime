import Migration from "./Migration.js";
import {PrimeItemManager} from "../item/PrimeItemManager.js";
import {isString} from "../util/support.js";
import PrimeMigration_Item_0_2_0 from "./PrimeMigration_Item_0_2_0.js";



function appendNote(gameSystemData, note) {
    gameSystemData.notes.core = `${gameSystemData.notes.core}<br>${note}`;
}


export default class PrimeMigration_Actor_0_2_1 extends Migration {
    static get version() {
        return '0.2.1';
    }

    static async canMigrate() {
        const primeItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'prime'});
        const refinementItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'refinement'});
        let can = true;
        let reason = 'Missing'
        if (primeItems.length === 0) {
            reason = `${reason} prime`
            can = false;
        }
        if (refinementItems.length === 0) {
            reason = `${reason}${can ? '' : ' &'} refinement`
            can = false;

        }
        reason = can ? Migration.SUCCESS_REASON : `${reason} items. Import Statistic and Lies Compendium and retry.`
        return {can, reason};
    }

    static async migrate() {
        const primeItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'prime'});
        const refinementItems = PrimeItemManager.getItems({justContentData: true, itemBaseTypes: 'refinement'});
        const actors = game.actors.contents;


        for (const actorDoc of actors) {

            const embeddedItems = actorDoc.items;
            for(const embeddedItem of embeddedItems){
                await PrimeMigration_Actor_0_2_1.migrateEmbeddedItem(embeddedItem);
            }
        }

        for (const actorDoc of actors) {
            const foundryData = actorDoc.data;
            const gameSystemData = foundryData.data;
            let itemsToEmbed = [];
            PrimeMigration_Actor_0_2_1.migrateNotes(gameSystemData);
            appendNote(gameSystemData, `<u><b>🛠 Migration Log of '${PrimeMigration_Actor_0_2_1.version}'</b></u><br><i>The following 🐐 goats 🐐 were herded:</i><br>`);
            PrimeMigration_Actor_0_2_1.migrateProfile(gameSystemData);

            if (primeItems.length > 0 && actorDoc.itemTypes['prime'].length === 0) {
                itemsToEmbed = itemsToEmbed.concat(PrimeMigration_Actor_0_2_1.migratePrimes(actorDoc, gameSystemData, primeItems));
            }
            if (refinementItems.length > 0 && actorDoc.itemTypes['refinement'].length === 0) {
                itemsToEmbed = itemsToEmbed.concat(PrimeMigration_Actor_0_2_1.migrateRefinements(actorDoc, gameSystemData, refinementItems));
            }
            await actorDoc.update(foundryData.toObject(false));

            if (itemsToEmbed.length > 0) {
                const embedded = await actorDoc.createEmbeddedDocuments("Item", itemsToEmbed);
                console.log(embedded);
            }
        }
        return true;
    }

    static migrateProfile(gameSystemData) {
        if (gameSystemData.metadata != null) {
            gameSystemData.profile = gameSystemData.metadata;
            gameSystemData.profile.npc = gameSystemData.profile.isNPC;
            delete gameSystemData.profile.isNPC;
            gameSystemData.metadata = undefined;
        }
    }

    static migrateNotes(gameSystemData) {
        if (!gameSystemData.notes.core) {
            gameSystemData.notes = {core: gameSystemData.notes || ''};
        }
    }

    static migratePrimes(actor, gameSystemData, primeItems) {

        if (gameSystemData.primes != null) {
            const primesToEmbed = [];
            for (const [key, oldPrime] of Object.entries(gameSystemData.primes)) {
                const name = PrimeMigration_Actor_0_2_1.PRIME_MAP.get(key)
                const newPrime = primeItems.find(item => item.name == name);
                if (newPrime == null) {
                    throw `Unable to find required prime '${name}' to migrate. Double check the prime mappings.`;
                }
                if (newPrime.data.metadata.default === true || oldPrime.value > 0) {
                    const primeFoundryData = foundry.utils.deepClone(newPrime);
                    const primeGameSystem = primeFoundryData.data;
                    primeGameSystem.value = oldPrime.value;
                    primesToEmbed.push(primeFoundryData);
                } else {
                    appendNote(gameSystemData, `✎⭲ Did Not Migrate Prime: ${key} to ${name} because the value is 0, and its not a default prime.`);
                }
            }
            if (primesToEmbed.length > 0) {
                return primesToEmbed;
            }
            gameSystemData.primes = null;
        }
        return [];
    }

    static migrateRefinements(actor, gameSystemData, refinementItems) {
        if (gameSystemData.refinements != null) {
            const refinementsToEmbed = new Map();
            for (const [key, oldRefinement] of Object.entries(gameSystemData.refinements)) {
                const names = PrimeMigration_Actor_0_2_1.REFINEMENT_MAP.get(key);
                if (names == null) {
                    appendNote(gameSystemData, `✖? Unable to Migrate Refinement: ${key}:${oldRefinement.value} as there is no listed equivalent, you may want to make your own.`);
                } else {
                    for (const name of names) {
                        if (refinementsToEmbed.has(name)) {
                            const refinementFoundryData = refinementsToEmbed.get(name);
                            const refinementGameSystem = refinementFoundryData.data;
                            const currentValue = refinementGameSystem.value;
                            if (currentValue < oldRefinement.value) {
                                refinementGameSystem.value = oldRefinement.value
                                appendNote(gameSystemData, `✎⮑ Migrated Refinement: ${key}:${oldRefinement.value} to ${name}:${refinementGameSystem.value} which already exists, increasing value from ${currentValue} to match.`);
                            } else if (currentValue === oldRefinement.value) {
                                appendNote(gameSystemData, `✎⥤ Migrated Refinement: ${key}:${oldRefinement.value} to ${name}:${refinementGameSystem.value} which already exists, value remains the same.`);
                            } else {
                                appendNote(gameSystemData, `✎⭲ Migrated Refinement: ${key}:${oldRefinement.value} to ${name}:${refinementGameSystem.value} which already exists, will keep higher value.`);
                            }
                        } else {
                            const newRefinement = refinementItems.find(item => item.name == name);
                            if (newRefinement == null) {
                                throw `Unable to find required refinement '${name}' to migrate. Double check the refinement mappings.`;
                            }
                            if (newRefinement.data.metadata.default === false || oldRefinement.value > 0) {
                                const refinementFoundryData = foundry.utils.deepClone(newRefinement);
                                const refinementGameSystem = refinementFoundryData.data;
                                refinementGameSystem.value = oldRefinement.value;
                                if (refinementFoundryData.name.startsWith('Culture')) {
                                    const culture = actor.profile.birthplace
                                        || actor.profile.celestial
                                        || actor.profile.faction
                                        || actor.profile.race
                                        || '...';
                                    refinementFoundryData.name = refinementFoundryData.name.replace('...', culture);
                                }
                                refinementsToEmbed.set(name, refinementFoundryData);
                                appendNote(gameSystemData, `✎⭢ Migrated Refinement: ${key}:${oldRefinement.value} to ${refinementFoundryData.name}:${refinementGameSystem.value}`);
                            } else {
                                appendNote(gameSystemData, `✎⭲ Did Not Migrate Refinement: ${key} to ${name} because the value is 0, and its not a default refinement.`);
                            }
                        }
                    }
                }
            }
            if (refinementsToEmbed.size > 0) {
                return Array.from(refinementsToEmbed.values());
            }
            gameSystemData.refinements = null;
        }
        return [];
    }

    static async migrateEmbeddedItem(itemDoc) {
        const foundryData = itemDoc.data;
        const gameSystemData = foundryData.data;
        await PrimeMigration_Item_0_2_0.migrateItem(itemDoc, true);

        await itemDoc.update(foundryData.toObject(false));

        let newSourceKey = gameSystemData.sourceKey || itemDoc.getFlag('core', 'sourceId');
        if (newSourceKey.startsWith('Item.')) {
            newSourceKey = newSourceKey.slice(5);
        }
        gameSystemData.metadata.sourceKey = newSourceKey;
    }

    static PRIME_MAP = new Map([
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

    static REFINEMENT_MAP = new Map([
        ["animal", undefined],
        ["artistic", undefined],
        ["vehicle", undefined],
        ["survival", undefined],
        ["athletic", ['Athletic']],
        ["craft", ['Lock Picking', 'Alchemy']],
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
        ["recover", ['Recover', 'Meditate']],
        ["willpower", ['Willpower']],
        ["conduit", ['Manifest']],
        ["fury", ['Fury']],
        ["manifest", ['Manifest']],
        ["premonition", ['Premonition']],
        ["regeneration", ['Regenerate']],
        ["tap", ['Manifest']],
        ["threads", ['Threads']]]);

}