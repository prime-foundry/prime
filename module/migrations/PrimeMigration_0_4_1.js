import Migration from "./Migration.js";
import {PrimeItem} from "../item/PrimeItem.js";

export default class PrimeMigration_0_4_1 extends Migration
{
	static async migrate() {
		game.items.forEach(await PrimeMigration_0_4_1.migrateItem);
		return true;
	}

	static get version(){
		return '0.4.1';
	}

	static async migrateItem(itemDoc) {
		const foundryData = itemDoc.data;
		const gameSystemData = foundryData.data;
		const item = itemDoc.dyn.typed;
		if(item.audit.setCreationAuditIfMissing(gameSystemData.creator, gameSystemData.creatorID, gameSystemData.created)){
			item.audit.appendUpdatedAudit(gameSystemData.creator, gameSystemData.creatorID, gameSystemData.created);
			item.audit.appendUpdatedAudit(gameSystemData.updater, gameSystemData.updaterID, gameSystemData.updated);
			if(gameSystemData.updater != null){
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
		await foundryData.update(foundry.utils.deepClone(foundryData),{render:false});
	}

}