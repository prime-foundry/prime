import Migration from "./Migration.js";
import PrimeItemTables from "../item/PrimeItemTables.js";
import {PrimeItemManager} from "../item/PrimeItemManager.js";
import PrimeMigration_Actor_0_2_1 from "./PrimeMigration_Actor_0_2_1.js";

/*
 *    ["item", "melee-weapon", "ranged-weapon", "shield", "armour", "perk", "action", "prime", "refinement", "injury", "award"]
 */

function appendNote(gameSystemData, note) {
    gameSystemData.notes.core = `${gameSystemData.notes.core}<br>${note}`;
}

export default class PrimeMigration_Item_0_2_0 extends Migration {
    static get version() {
        return '0.2.0';
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
        const items = game.items.contents;
        for (const item of items) {
            await PrimeMigration_Item_0_2_0.migrateItem(item);
        }
        return true;
    }

    static async migrateItem(itemDoc, embedded = false) {
        const foundryData = itemDoc.data;
        const gameSystemData = foundryData.data;
        const item = itemDoc.dyn.typed;
        PrimeMigration_Item_0_2_0.migrateMetadata(item, gameSystemData, embedded);
        PrimeMigration_Item_0_2_0.migrateAudit(item, gameSystemData);
        PrimeMigration_Item_0_2_0.migrateCosts(itemDoc, item, gameSystemData);
        PrimeMigration_Item_0_2_0.migrateDescriptions(item, gameSystemData);
        PrimeMigration_Item_0_2_0.migrateMetrics(item, gameSystemData);
        PrimeMigration_Item_0_2_0.migrateArmour(item, gameSystemData);
        PrimeMigration_Item_0_2_0.migratePrerequisites(item, gameSystemData);
        PrimeMigration_Item_0_2_0.migrateModifiers(item, gameSystemData);
        PrimeMigration_Item_0_2_0.migrateActions(item, gameSystemData);

        await itemDoc.update(foundryData.toObject(false));
    }

    /**
     * We should be able to support more than one cost now.
     * @param itemDoc
     * @param item
     * @param gameSystemData
     */
    static migrateCosts(itemDoc, item, gameSystemData) {
        //various
        if (gameSystemData.valueType != null) {
            if (gameSystemData.costs == null) {
                gameSystemData.costs = [];
            }
            gameSystemData.costs.push({type: gameSystemData.valueType, amount: gameSystemData.valueAmount});
            gameSystemData.valueType = null;
            gameSystemData.valueAmount = null;
        }

        // perks
        if (itemDoc.type === 'perk') {
            if (gameSystemData.costs == null) {
                gameSystemData.costs = [];
            }
            if (gameSystemData.cost != null && gameSystemData.cost.attributeType != null) {
                gameSystemData.costs.push({
                    type: gameSystemData.cost.attributeType,
                    amount: gameSystemData.cost.amount || 0
                });
                gameSystemData.cost = null;
            }
        }

    }

    static migrateMetadata(item, gameSystemData, embedded) {
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
        if (!embedded) {
            gameSystemData.metadata.sourceKey = item.id;
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


    static migrateMetrics(item, gameSystemData) {
        if (["item", "melee-weapon", "ranged-weapon", "shield", "armour"].includes(item.type) && gameSystemData.metrics == null) {
            const metrics = {};
            metrics.rarity = gameSystemData.rarity;
            metrics.quantity = Number.parseInt(gameSystemData.quantity) || 0;
            metrics.weight = Number.parseInt(gameSystemData.weight) || 0;
            gameSystemData.metrics = metrics
        }
    }

    static migrateArmour(item, gameSystemData) {
        if (item.type === 'armour') {
            if (gameSystemData.armour == null) {
                gameSystemData.armour = {};
            }
            const armour = item.armour;
            if (gameSystemData.armourResilience != null) {
                armour.resilience = gameSystemData.armourResilience;
                gameSystemData.armourResilience = null;
            } else if (armour.resilience == null) {
                armour.resilience = 0;
            }
            if (gameSystemData.armourType != null) {
                armour.type = gameSystemData.armourType;
                gameSystemData.armourType = null;
            } else if (armour.type == null) {
                armour.type = 'other';
            }
            if (gameSystemData.protection != null) {
                armour.protection = gameSystemData.protection;
                gameSystemData.protection = null;
            } else if (armour.protection == null) {
                armour.protection = 0;
            }
            if (gameSystemData.keywords != null) {
                const oldKeywords = gameSystemData.keywords || {};
                const keywordTable = Array.from(Object.keys(PrimeItemTables.armour.keywords));
                keywordTable.sort();
                armour.keywords = keywordTable.filter((value, index) => oldKeywords[index] != null && oldKeywords[index]);
                gameSystemData.keywords = null;
            } else if (armour.keywords == null) {
                armour.keywords = [];
            }
            if (gameSystemData.untrainedPenalty != null) {
                const oldPenalties = gameSystemData.untrainedPenalty || {};
                const untrainedPenaltiesTable = Array.from(Object.keys(PrimeItemTables.armour.untrainedPenalties));
                untrainedPenaltiesTable.sort();
                armour.untrainedPenalties = untrainedPenaltiesTable.filter((value, index) => oldPenalties[index] != null && oldPenalties[index]);
                gameSystemData.untrainedPenalty = null;
            } else if (armour.untrainedPenalties == null) {
                armour.untrainedPenalties = [];
            }

        } else if (item.type === 'shield') {
            const armour = {};
            armour.keywords = [];
            armour.untrainedPenalties = [];
            armour.armourType = 'other';
            armour.protection = 0;
            armour.resilience = 0;
            gameSystemData.armour = {};
        }
    }

    static migrateModifiers(item, gameSystemData) {
        if (["item", "melee-weapon", "ranged-weapon", "shield", "perk"].includes(item.type)) {
            const oldBonuses = Object.entries(gameSystemData.bonuses || {});
            const modifiers = [];

            const primeItems = PrimeItemManager.getItems({justContentData: false, itemBaseTypes: 'prime'});
            const refinementItems = PrimeItemManager.getItems({justContentData: false, itemBaseTypes: 'refinement'});

            const equipped = ["item", "melee-weapon", "ranged-weapon", "shield"].includes(item.type);
            oldBonuses.forEach(([key, bonus]) => {
                switch (bonus.bonusType) {
                    case "situationalPrime": {
                        const type = 'prime';
                        const rules = 'Please read the descriptions';
                        const value = bonus.value || 0;
                        const situational = true;
                        const names = PrimeMigration_Actor_0_2_1.PRIME_MAP.get(bonus.path) || [];

                        primeItems.filter(item => names.includes(item.name)).forEach(bonusItem => {
                            modifiers.push({type, target: bonusItem.id, value, rules, situational, equipped});
                        });
                        break;
                    }
                    case "situationalRefinement": {
                        const type = 'refinement';
                        const rules = 'Please read the descriptions';
                        const value = bonus.value || 0;
                        const situational = true;
                        const names = PrimeMigration_Actor_0_2_1.REFINEMENT_MAP.get(bonus.path) || [];

                        refinementItems.filter(item => names.includes(item.name)).forEach(bonusItem => {
                            modifiers.push({type, target: bonusItem.id, value, rules, situational, equipped});
                        });
                        break;
                    }
                    case "extraAction": {
                        const type = 'extraAction';
                        const target = bonus.path;
                        const rules = 'Please read the descriptions';
                        const value = bonus.value || 0;
                        const situational = false;
                        modifiers.push({type, target, value, rules, situational, equipped});
                        break;
                    }
                    case "actionPointBonus": {
                        const type = 'action';
                        const target = bonus.path;
                        const rules = 'Please read the descriptions';
                        const value = bonus.value || 0;
                        const situational = false;
                        modifiers.push({type, target, value, rules, situational, equipped});
                        break;
                    }
                    case "actorStatBonus": {
                        const type = 'actor';
                        const target = bonus.path;
                        const rules = 'Please read the descriptions';
                        const value = bonus.value || 0;
                        const situational = false;
                        modifiers.push({type, target, value, rules, situational, equipped});
                        break;
                    }
                    case "externalStatBonus":
                    case "misc":
                    default: {
                        const type = 'misc';
                        const target = '';
                        const rules = 'Please read the descriptions';
                        const value = bonus.value || 0;
                        const situational = false;
                        modifiers.push({type, target, value, rules, situational, equipped});
                        break;
                    }
                }
            });
            gameSystemData.modifiers = modifiers;
            gameSystemData.bonuses = null;
        }
    }

    static migratePrerequisites(item, gameSystemData) {
        if (["perk"].includes(item.type)) {

            const primeItems = PrimeItemManager.getItems({justContentData: false, itemBaseTypes: 'prime'});
            const refinementItems = PrimeItemManager.getItems({justContentData: false, itemBaseTypes: 'refinement'});

            const oldPrerequisites = Object.entries(gameSystemData.prerequisites || {});
            const prerequisites = [];

            oldPrerequisites.forEach(([key, prereq]) => {
                switch (prereq.prerequisiteType) {
                    case "minimumPrime": {
                        const type = "prime"
                        const qualifier = 'GREATER_OR_EQUALS';
                        const value = Number.parseInt(prereq.value) || 1;
                        const names = PrimeMigration_Actor_0_2_1.PRIME_MAP.get(prereq.path) || [];

                        primeItems.filter(item => names.includes(item.name)).forEach(prereqItem => {
                            prerequisites.push({type, target: prereqItem.id, qualifier, value});
                        });
                        break;
                    }
                    case "minimumRefinement": {
                        const type = "refinement";
                        const qualifier = 'GREATER_OR_EQUALS';
                        const value = Number.parseInt(prereq.value) || 1;
                        const names = PrimeMigration_Actor_0_2_1.REFINEMENT_MAP.get(prereq.path) || [];
                        refinementItems.filter(item => names.includes(item.name)).forEach(prereqItem => {
                            prerequisites.push({type, target: prereqItem.id, qualifier, value});
                        });
                        break;
                    }
                    case  "minimumStat": {
                        const type = "actor";
                        const qualifier = 'GREATER_OR_EQUALS';
                        const value = Number.parseInt(prereq.value) || 1;
                        const target = prereq.path;
                        prerequisites.push({type, target, qualifier, value});
                        break;
                    }
                    case "maximumPrime": {
                        const type = "prime";
                        const qualifier = 'LESS_OR_EQUALS';
                        const value = Number.parseInt(prereq.value) || 10;
                        const names = PrimeMigration_Actor_0_2_1.PRIME_MAP.get(prereq.path) || [];
                        primeItems.filter(item => names.includes(item.name)).forEach(prereqItem => {
                            prerequisites.push({type, target: prereqItem.id, qualifier, value});
                        });
                        break;
                    }
                    case  "maximumRefinement": {
                        const type = "refinement";
                        const qualifier = 'LESS_OR_EQUALS';
                        const value = Number.parseInt(prereq.value) || 10;
                        const names = PrimeMigration_Actor_0_2_1.REFINEMENT_MAP.get(prereq.path) || [];
                        refinementItems.filter(item => names.includes(item.name)).forEach(prereqItem => {
                            prerequisites.push({type, target: prereqItem.id, qualifier, value});
                        });
                        break;
                    }
                    case  "maximumStat": {
                        const type = "actor";
                        const qualifier = 'LESS_OR_EQUALS';
                        const value = Number.parseInt(prereq.value) || 10;
                        const target = prereq.path;
                        prerequisites.push({type, target, qualifier, value});
                        break;
                    }
                    case "otherPerk": {
                        const type = "perk";
                        const qualifier = 'EXISTS';
                        const value = 0;
                        const target = prereq.path;
                        prerequisites.push({type, target, qualifier, value});
                        break;
                    }
                }
            });

            gameSystemData.prerequisites = prerequisites
        } else if (["item", "melee-weapon", "ranged-weapon", "shield"].includes(item.type)) {
            gameSystemData.prerequisites = [];
        }
    }

    static migrateActions(item, gameSystemData) {
        if (gameSystemData.actionType == null) {
            gameSystemData.actionType = gameSystemData.type;
            gameSystemData.type = null;
        }
        if (gameSystemData.actionPoints == null) {
            gameSystemData.actionPoints = gameSystemData.points;
            gameSystemData.points = null;
        }
        if (gameSystemData.actionEffects == null) {

            const oldEffects = Object.entries(gameSystemData.effects || {});
            const actionEffects = [];

            oldEffects.forEach(([, effect]) => {
                if (effect.effectSubType === 'gainPoints') {
                    const type = effect.effectSubType;
                    const target = effect.path;
                    const value = 0;
                    actionEffects.push({type, target, value});
                } else {
                    const type = effect.effectSubType;
                    const target = '';
                    const value = 0;
                    actionEffects.push({type, target, value});
                }
            });

            gameSystemData.actionEffects = actionEffects;
            gameSystemData.effects = null;
        }
    }
}