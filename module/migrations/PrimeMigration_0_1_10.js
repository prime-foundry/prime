import Migration from "./Migration.js";

export default class PrimeMigration_0_1_10 extends Migration
{
	static async migrate()
	{
		return await this.updateItems()
	}

	static get version(){
		return '0.1.10';
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