export class PrimeMigration_0_7_0_and_0_8_0_to_0_8_1
{
    static async update()
    {
        ui.notifications.info("Migrating world to version 0.8.1.");
        this._updateItems().then(()=>
        {
            {
                const message = "Migration to version 0.8.1 successful, goats were herded.";
                ui.notifications.info(message);
                console.log(message);
                game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.version);
            }
        }).catch(()=>
        {
            {
                const error = "Migration to version 0.8.1 failed, goats were not herded. See console for more details (maybe).";
                ui.notifications.error(error);
                console.error(error);
            }
        });
    }

    static async _updateItems()
    {
        const updatePromise = await game.items.updateAll(
            PrimeMigration_0_7_0_and_0_8_0_to_0_8_1._performItemUpdate,
            PrimeMigration_0_7_0_and_0_8_0_to_0_8_1._shouldUpdate
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
            updatedItem = PrimeMigration_0_7_0_and_0_8_0_to_0_8_1._updateArmour(updatedItem);
        }
        if (updatedItem.type == "melee-weapon" || updatedItem.type == "ranged-weapon" || updatedItem.type == "shield")
        {
            updatedItem = PrimeMigration_0_7_0_and_0_8_0_to_0_8_1._updateWeapon(updatedItem);
        }
        return updatedItem;
    }

    static _updateArmour(armour)
    {
        return armour;
    }

    static _updateWeapon(armour)
    {
        return armour;
    }
}

window.PrimeMigration_0_7_0_and_0_8_0_to_0_8_1 = PrimeMigration_0_7_0_and_0_8_0_to_0_8_1;