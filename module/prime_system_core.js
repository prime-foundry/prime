// Import Modules
import { PrimeActor } from "./actor/PrimeActor.js";
import { PrimeActorSheet } from "./actor/PrimeActorSheet.js";
import { PrimeItem as PrimeItem } from "./item/PrimeItem.js";
import { PrimeItemSheet } from "./item/PrimeItemSheet.js";

import { PrimeSettingsManager } from "./prime_settings.js";
import { PrimeHandlebarsPartials } from "./prime_handlebars.js";
import { PrimeDataMigrationManager } from "./migrations/prime_data_migrations_manager.js";

Hooks.once('init', async function ()
{

	game.prime = {
		PrimeActor,
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
	CONFIG.Actor.documentClass = PrimeActor;
	CONFIG.Item.documentClass = PrimeItem;

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("prime", PrimeActorSheet, { makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("prime", PrimeItemSheet, { makeDefault: true });



	// If you need to add Handlebars helpers, here are a few useful examples:
	Handlebars.registerHelper('concat', function ()
	{
		var outStr = '';
		for (var arg in arguments)
		{
			if (typeof arguments[arg] != 'object')
			{
				outStr += arguments[arg];
			}
		}
		return outStr;
	});

	Handlebars.registerHelper('toLowerCase', function (str)
	{
		return str.toLowerCase();
	});
});

Hooks.once("ready", async function ()
{

	await PrimeSettingsManager.addSettings();
	await PrimeHandlebarsPartials.loadPartials();
	await PrimeDataMigrationManager.performIfMigrationRequired();

});