export class PrimeMigration_0_7_0_and_0_8_0_to_0_10_0
{
    static async update()
    {
        ui.notifications.info("Migrating world to version 0.10.0.");
        this._updateItems().then(()=>
        {
            {
                const message = "Migration to version 0.10.0 successful, goats were herded.";
                ui.notifications.info(message);
                console.log(message);
                game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.version);
            }
        }).catch(()=>
        {
            {
                const error = "Migration to version 0.10.0 failed, goats were not herded. See console for more details (maybe).";
                ui.notifications.error(error);
                console.error(error);
            }
        });
    }

    static async _updateItems()
    {
        const updatePromise = await game.items.updateAll(
            PrimeMigration_0_7_0_and_0_8_0_to_0_10_0._performItemUpdate,
            PrimeMigration_0_7_0_and_0_8_0_to_0_10_0._shouldUpdate
        );
        return updatePromise;
    }

    static _shouldUpdate(item)
    {
        return ["armour", "melee-weapon", "ranged-weapon", "shield"].includes(item.type);
    }

    static _performItemUpdate(item)
    {
        let updatedItem = { ...item };
        if (updatedItem.type == "armour")
        {
            updatedItem = PrimeMigration_0_7_0_and_0_8_0_to_0_10_0._updateArmour(updatedItem);
        }
        if (updatedItem.type == "melee-weapon" || updatedItem.type == "ranged-weapon" || updatedItem.type == "shield")
        {
            updatedItem = PrimeMigration_0_7_0_and_0_8_0_to_0_10_0._updateWeapon(updatedItem);
        }
        return updatedItem;
    }

    static _updateArmour(armour)
    {
        delete armour.system.protection;
        // No other adjustments required? Keyword data is checked against existing data, so any legacy keywords will never find a match
        // so probably not worth the effort of digging inside the effects data?
        return armour;
    }

    static _updateWeapon(weapon)
    {
        // No adjustments required? Keyword data is checked against existing data, so any legacy keywords will never find a match
        // so probably not worth the effort of digging inside the effects data?
        return weapon;
    }
}
