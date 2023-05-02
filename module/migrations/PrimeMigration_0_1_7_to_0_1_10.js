export class PrimeMigration_0_1_7_to_0_1_10
{
	static async update()
	{
		ui.notifications.info("Migrating world from 0.1.7 (or lower) to version 0.1.10.");
		var success = await this.updateItems();

		if (success)
		{
			const message = "Migration to version 0.1.10 successful, goats were herded.";
			ui.notifications.info(message);
			console.log(message);
			game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.data.version);
		}
		else
		{
			const error = "Migration to version 0.1.10 failed, goats were not herded. See console for more details.";
			ui.notifications.error(error);
			console.error(error);
		}
	}

	static async updateItems()
	{
		for ( let item of game.items.entities )
		{
			const itemType = item.data.type;
			switch (itemType)
			{
				case "action":
					var success = await this.updateAction(item);
				break;
			}
		}
		return success;
	}

	static async updateAction(whatAction)
	{
		//i.update(updateData, {enforceTypes: false});
		if (!whatAction.data.data.sourceKey)
		{
			let updateData =
			{
				data:
				{
					sourceKey: whatAction._id
				}
			};
			await whatAction.update(updateData, {enforceTypes: false});
		}
		return true;
	}
}