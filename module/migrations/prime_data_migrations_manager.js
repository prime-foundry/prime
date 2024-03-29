import { PrimeMigration_0_1_7_to_0_1_10 } from "./PrimeMigration_0_1_7_to_0_1_10.js";
import { PrimeMigration_0_1_10_to_0_3_1 } from "./PrimeMigration_0_1_10_to_0_3_1.js";
import { PrimeMigration_0_3_1_to_0_4_0 } from "./PrimeMigration_0_3_1_to_0_4_0.js";
import { PrimeMigration_0_7_0_and_0_8_0_to_0_10_1 } from "./PrimeMigration_0_7_0_and_0_8_0_to_0_10_1.js";

export class PrimeDataMigrationManager
{
    constructor()
    {
        this.initialVersionOfImplementation = "0.1.10";
    }

    static async performIfMigrationRequired()
    {
        const migrationRequired = this.checkSystemVsWorldVersions();
        if (migrationRequired)
        {
            this.performMigration();
        }
    }

    static checkSystemVsWorldVersions()
    {
        if (!game.user.isGM)
        {
            return false;
        }

        const currentWorldVersion = game.settings.get("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber");
        const systemVersion = game.system.version;

        if (!currentWorldVersion)
        {
            if (systemVersion == this.initialVersionOfImplementation)
            {
                ui.notifications.info("Initial implementation, migration should be happening regardless.");
            }
            else
            {
                ui.notifications.info("Welcome to your new Prime world, we hope you have many happy adventures!");
                game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.version);
                return false;
            }
        }

        const needsMigration = isNewerVersion(systemVersion, currentWorldVersion);
        if (needsMigration)
        {
            // eslint-disable-next-line max-len
            ui.notifications.info("World migration required, please be patient and do not close your game or shut down your server. World version: '" + currentWorldVersion + "', System version: '" + systemVersion + "'");
            return true;
        }
        return false;
    }

    static performMigration()
    {
        const currentWorldVersion = game.settings.get("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber");
        const systemVersion = game.system.version;

        switch (currentWorldVersion)
        {
        case "": // This should only happen if the world is pre-implementation of this API
        case "0.1.7":
        case "0.1.8":
        case "0.1.9":
            PrimeMigration_0_1_7_to_0_1_10.update();
            break;
        case "0.1.10":
        case "0.1.11":
        case "0.1.12":
        case "0.1.13":
        case "0.1.14":
        case "0.1.15":
        case "0.1.16":
        case "0.1.17":
        case "0.1.19":
        case "0.2.1":
        case "0.2.2":
            PrimeMigration_0_1_10_to_0_3_1.update();
            break;
        case "0.3.1":
            PrimeMigration_0_3_1_to_0_4_0.update();
            break;
        case "0.7.0":
        case "0.8.0":
        case "0.9.0":
        case "0.9.1":
        case "0.10.0":
            PrimeMigration_0_7_0_and_0_8_0_to_0_10_1.update();
            break;
        case "0.10.1":
        case "0.11.0":
        case "0.12.0":
        case "0.12.2":
        case "0.13.0":
            this.migrateVersionNumberOnly();
            break;
        default:
            this.migrationError(currentWorldVersion, systemVersion);
            break;
        }
    }

    // Use this for updates that don't require data migration.
    static migrateVersionNumberOnly()
    {
        game.settings.set("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", game.system.version);
        const message = `Migration to version ${game.system.version} successful, goats were herded.`;
        ui.notifications.info(message);
    }

    static migrationError(currentWorldVersion, systemVersion)
    {
        // eslint-disable-next-line max-len
        const errorMessage = "WARNING: Attempting to migrate from world version '" + currentWorldVersion + "' to system version '" + systemVersion + "' but unable to find matching migration.";
        ui.notifications.warn(errorMessage);
        console.warn(errorMessage);
    }
}
