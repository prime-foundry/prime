import PrimeMigration_0_1_10 from "./PrimeMigration_0_1_10.js";
import PrimeMigration_0_4_1 from "./PrimeMigration_0_4_1.js";
import compareVersions from "./compare-versions.js";

const MIGRATIONS = [PrimeMigration_0_1_10, PrimeMigration_0_4_1];

MIGRATIONS.sort((a, b) => compareVersions(a.version, b.version));

const CURRENT_PRIME_VERSION_KEY = "notAutoIncrementedBeforeICanCheckItWorldVersionNumber";

export class PrimeDataMigrationManager {
    static initialVersionOfImplmentation = "0.1.10";

    static async forceMigrations(reset = false) {
        if (game.user.isGM) {
            if(reset){
                await game.settings.set("prime", CURRENT_PRIME_VERSION_KEY, '0');
            }
            await this.performMigration();
        }

    }

    static async performIfMigrationRequired() {
        if (game.user.isGM) {
            const migrationRequired = await this.checkIfSystemVersionHasChanged();
            if (migrationRequired) {
                await this.performMigration();
            }
        }
    }

    static async checkIfSystemVersionHasChanged() {
        const lastVersion = MIGRATIONS.length > 0 ? MIGRATIONS[MIGRATIONS.length -1].version : '0';
        const currentWorldVersion = game.settings.get("prime", CURRENT_PRIME_VERSION_KEY);
        const systemVersion = game.system.data.version;
        if (!currentWorldVersion) {
            if (systemVersion == this.initialVersionOfImplmentation) {
                ui.notifications.info("Initial implementation, migration should be happening regardless.");
            } else {
                ui.notifications.info("Welcome to your new Prime world, we hope you have many happy adventures! 🎉");
                await game.settings.set("prime", CURRENT_PRIME_VERSION_KEY, lastVersion);
                return false;
            }
        }

        const needsMigration = compareVersions(lastVersion, currentWorldVersion) > 0;
        if (needsMigration) {
            ui.notifications.info("World migration required, please be patient ☕ and do not close your game or shut down your server. World version: '" + currentWorldVersion + "', System version: '" + systemVersion + "'")
            return true;
        }
        return false;
    }

    /*
     * we are splitting migration versioning and system versioning, as they don't have to be as tightly coupled albeit we may follow the same plan.
     * As long as we capture that when a system version changes, there might be some MIGRATIONS to follow.
     */
    static async performMigration() {
        const currentPrimeVersion = game.settings.get("prime", CURRENT_PRIME_VERSION_KEY);
        const systemVersion = game.system.data.version;

        // will find the index of the first migration not run yet.
        const idx = MIGRATIONS.findIndex(migrations => compareVersions(migrations.version, currentPrimeVersion) > 0)

        if (idx >= 0) {
            const migrationsToRun = MIGRATIONS.slice(idx);
            for (const migration of migrationsToRun) {
                let success;
                try {
                    const startedMessage = `Migration ${migration.version} started, locating 🐐 goats 🐐.`
                    ui.notifications.info(startedMessage);
                    console.log(startedMessage);

                    success = await migration.migrate();

                    if(success){
                        const message = `Migration ${migration.version} successful, 🐐 goats 🐐 were herded.`
                        ui.notifications.info(message);
                        console.log(message);

                        await game.settings.set("prime", CURRENT_PRIME_VERSION_KEY, migration.version);
                    }
                } catch (err) {
                    console.error(err)
                    success = false;
                }
                if (!success) {
                    const errorMessage =
`ERROR: Attempting to migrate from version '${currentPrimeVersion}' to system version '${systemVersion}'\
 but failed at Migration ${migration.version}.\
 some 🐐 goats 🐐 were lost. See console for more details.`;
                    ui.notifications.error(errorMessage);
                    console.error(errorMessage)
                    return;
                }
            }

            const message = "All migrations are now complete, the 🐐 goats 🐐 are back in control."
            ui.notifications.info(message);
        }

    }

}