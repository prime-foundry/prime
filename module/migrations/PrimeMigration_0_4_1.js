import Migration from "./Migration.js";

export default class PrimeMigration_0_4_1 extends Migration {
    static get version() {
        return '0.4.1';
    }

    static async migrate() {
        const items = game.items.contents;
        for(const item of items) {
            await PrimeMigration_0_4_1.migrateItem(item);
        }
        return true;
    }

    static async migrateItem(itemDoc) {
        const foundryData = itemDoc.data;
        const gameSystemData = foundryData.data;
        const item = itemDoc.dyn.typed;
        PrimeMigration_0_4_1.migrateAudit(item, gameSystemData);
        PrimeMigration_0_4_1.migrateDescriptions(item, gameSystemData);
        PrimeMigration_0_4_1.migrateMetadata(item, gameSystemData);

        await foundryData.update(foundry.utils.deepClone(foundryData), {render: false});
    }

    static migrateMetadata(item, gameSystemData) {
        if (gameSystemData.setting != null) {
            item.metadata.setting = gameSystemData.setting;
            gameSystemData.setting = null;
        }
        if(item.metadata.default  != null) {
            item.metadata.default = gameSystemData.default;
            gameSystemData.default = null;
        }
        if(item.metadata.customisable  != null) {
            item.metadata.customisable = gameSystemData.customisable;
            gameSystemData.customisable = null;
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
}