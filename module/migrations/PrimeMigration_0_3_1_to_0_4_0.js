export class PrimeMigration_0_3_1_to_0_4_0
{
	static async update()
	{
		ui.notifications.info("Migrating world to version 0.4.0.");
		var success = await this.updateActors();

		if (success)
		{
			const message = "Migration to version 0.4.0 successful, goats were herded.";
			ui.notifications.info(message);
			console.log(message);
			game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.version);
		}
		else
		{
			const error = "Migration to version 0.4.0 failed, goats were not herded. See console for more details (maybe).";
			ui.notifications.error(error);
			console.error(error);
		}
	}

	static async updateActors()
	{
		//updateAll()
		return true;
	}
}