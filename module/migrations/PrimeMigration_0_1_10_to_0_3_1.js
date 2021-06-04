export class PrimeMigration_0_1_10_to_0_3_1
{
	static async update()
	{
		ui.notifications.info("Migrating world to version 0.3.1.");
		var success = await this.updateActors();

		if (success)
		{
			const message = "Migration to version 0.3.1 successful, goats were herded."
			ui.notifications.info(message);
			console.log(message);
			game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.data.version);
		}
		else
		{
			const error = "Migration to version 0.3.1 failed, goats were not herded. See console for more details (maybe).";
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