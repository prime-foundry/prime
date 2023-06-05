// Import Modules
import { PrimePCActor } from "./actor/actor.js";
import { PrimePCActorSheet } from "./actor/actor-sheet.js";
import { PrimeItem as PrimeItem } from "./item/item.js";
import { PrimeItemSheet } from "./item/item-sheet.js";

import { PrimeSettingsManager } from "./prime_settings.js";
import { PrimeHandlebarsPartials } from "./prime_handlebars.js";
import { PrimeDataMigrationManager } from "./migrations/prime_data_migrations_manager.js";
import { ActorMigrationsManager } from "./migrations/actor-migrations-manager.js";

Hooks.once("init", async function ()
{
    game.prime = {
        PrimePCActor,
        PrimeItem
    };

    /**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
    CONFIG.Combat.initiative = {
        formula: "1d100",
        decimals: 2
    };

    // Define custom Entity classes
    CONFIG.Actor.documentClass = PrimePCActor;
    CONFIG.Item.documentClass = PrimeItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("prime", PrimePCActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("prime", PrimeItemSheet, { makeDefault: true });

    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper("concat", function ()
    {
        var outStr = "";
        for (var arg in arguments)
        {
            if (typeof arguments[arg] != "object")
            {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper("toLowerCase", function (str)
    {
        return str.toLowerCase();
    });
});

Hooks.once("ready", async () =>
{
    await PrimeSettingsManager.addSettings();
    await PrimeHandlebarsPartials.loadPartials();
    await PrimeDataMigrationManager.performIfMigrationRequired();
    bindActorMigrationScripts();
});

const  bindActorMigrationScripts  = () =>
{
    window.createV2Clones = async () =>
    {
        await ActorMigrationsManager.createV2Clones();
    };
    window.migrateV2ToNewStats = async () =>
    {
        await ActorMigrationsManager.migrateV2ToNewStats();
    };
    window.removeV2Clones = async () =>
    {
        await ActorMigrationsManager.removeV2Clones();
    };
    window.removeV1LegacyCharacters = async () =>
    {
        await ActorMigrationsManager.removeV1LegacyCharacters();
    };
    window.removeDuplicateStats = async () =>
    {
        await ActorMigrationsManager.removeDuplicateStats();
    };
    window.removeTracesOfV2CloningProgramme = async () =>
    {
        await ActorMigrationsManager.removeTracesOfV2CloningProgramme();
    };

    console.log(`Actor migration methods bound:
    - createV2Clones()
    - migrateV2ToNewStats()
    - removeDuplicateStats()
    - removeV2Clones()
    - removeTracesOfV2CloningProgramme()
    - removeV1LegacyCharacters()`);
};
