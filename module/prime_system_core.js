// Import Modules
import { PrimeActor } from "./actor/PrimeActor.js";
import { PrimeActorSheet } from "./actor/PrimeActorSheet.js";
import { PrimeItem as PrimeItem } from "./item/PrimeItem.js";
import { PrimeItemSheet } from "./item/PrimeItemSheet.js";

import { PrimeHandlebarsPartials } from "./prime_handlebars.js";
import { PrimeDataMigrationManager } from "./migrations/PrimeDataMigrationsManager.js";
import {StaticModel} from "./util/DynFoundryMixins.js";
import PrimeItemTables from "./item/PrimeItemTables.js";
import PrimeActorTables from "./actor/PrimeActorTables.js";
import PrimeTables from "./PrimeTables.js";

Hooks.once('init', async function ()
{

	game.prime = {
		PrimeActor,
		PrimeItem
	};

	/**
	 * Set an initiative formula for the gameSystem
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
		formula: "1d100",
		decimals: 2
	};

	// Define custom Entity classes
	CONFIG.Actor.documentClass = PrimeActor;
	CONFIG.Item.documentClass = PrimeItem;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("prime", PrimeActorSheet, { makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("prime", PrimeItemSheet, { makeDefault: true });

	StaticModel.registerStaticModel('items', PrimeItemTables)
		.registerStaticModel('actor', PrimeActorTables)
		.registerStaticModel('core', PrimeTables);
});

Hooks.once("ready", async function ()
{
	await PrimeHandlebarsPartials.loadPartials();
	await PrimeDataMigrationManager.migrateIfNeeded();
});