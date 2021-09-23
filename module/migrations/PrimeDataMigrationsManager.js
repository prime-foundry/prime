import compareVersions from "./compare-versions.js";
import {isString} from "../util/support.js";

import PrimeMigration_0_1_10 from "./PrimeMigration_0_1_10.js";
import PrimeMigration_Item_0_2_0 from "./PrimeMigration_Item_0_2_0.js";
import PrimeMigration_Actor_0_2_1 from "./PrimeMigration_Actor_0_2_1.js";

const MIGRATIONS = [PrimeMigration_0_1_10, PrimeMigration_Item_0_2_0, PrimeMigration_Actor_0_2_1];

MIGRATIONS.sort((a, b) => compareVersions(a.version, b.version));

const CURRENT_PRIME_VERSION_KEY = "MigrationVersion";
const MIGRATING_KEY = "Migrating";

const TIMEOUT = 60;


function epochSeconds(date = new Date()){
	return Math.floor( date / 1000 );
}


export class PrimeDataMigrationManager {

	static addSettings() {

		game.settings.register("prime", "MigrationVersion", {
			name: "System Migration Version",
			scope: "world",
			config: false,
			type: String,
			default: "0"
		});
		game.settings.register("prime", "Migrating", {
			name: "Is Migrating",
			scope: "world",
			config: false,
			type: String,
			default: ""
		});
	}

	/**
	 * if reset is not defined or false, then we simply start from after the last migration.
	 * if reset is true, then we start from the beginning
	 * if reset is a string (version): then we start from after that version.
	 *
	 * @param (boolean|string) (reset=false)
	 * @returns {Promise<void>}
	 */
	static async migrateIfNeeded(reset = false) {
		if (game.user.isGM) {
			PrimeDataMigrationManager.addSettings();
			let version = '0'
			let shouldReset = reset;
			if (isString(reset)) {
				version = reset;
				shouldReset = true;
			}
			if (shouldReset) {
				await game.settings.set("prime", CURRENT_PRIME_VERSION_KEY, version);
			}
			await this.performMigration();
		}
	}

	static async removeMigratingFlag() {
		await game.settings.set("prime", MIGRATING_KEY, "");
	}

	/*
	 * we are splitting migration versioning and system versioning, as they don't have to be as tightly coupled albeit we may follow the same plan.
	 * As long as we capture that when a system version changes, there might be some MIGRATIONS to follow.
	 */
	static async performMigration() {
		// prevent 2 GMS logging in at the same time, and kicking of duplicate migrations.
		const now =epochSeconds()
		const migrationValue = `${now}`;
		const isMigrating = game.settings.get("prime", MIGRATING_KEY);
		if (isMigrating !== "") {
			const then = Number.parseInt(isMigrating);
			// timeout
			const diff = now-then
			if(diff < TIMEOUT) {
				const left = TIMEOUT - diff;
				const minutes = Math.floor(left/60);
				const seconds = Math.floor(left - (minutes * 60));
				const message = `already migrating. Try again in: ${minutes} mins ${seconds} seconds`;
				console.warn(message);
				ui.notifications.warn(message);
				return;
			}
		}
		await game.settings.set("prime", MIGRATING_KEY, migrationValue);
		const migrationKey = game.settings.get("prime", MIGRATING_KEY);
		// we move the chances of a race condition to milliseconds, which is more than enough for this use case..
		if (migrationKey !== migrationValue) {
			console.warn('someone is already migrating.');
			return;
		}
		try {
			const currentPrimeVersion = game.settings.get("prime", CURRENT_PRIME_VERSION_KEY);
			const systemVersion = game.system.data.version;

			// will find the index of the first migration not run yet.
			const idx = MIGRATIONS.findIndex(migrations => compareVersions(migrations.version, currentPrimeVersion) > 0)

			if (idx >= 0) {
				const migrationsToRun = MIGRATIONS.slice(idx);
				const endMigrationVersion = migrationsToRun[migrationsToRun.length-1].version;
				const initialMessage = `World migration required, please be patient ☕ and do not close your game or shut down your server. \
Migrated version: '${currentPrimeVersion}', Migrating to: '${endMigrationVersion}' System template version: '${systemVersion}', \
Migrations to Run: ['${migrationsToRun.map(m => m.version).join("', '")}']`;
				ui.notifications.info(initialMessage);
				console.info(initialMessage);

				for (const migration of migrationsToRun) {
					let success = false;
					const {can, reason} = await migration.canMigrate()
					if (can) {
						try {
							const startedMessage = `Migration ${migration.version} started, locating 🐐 goats 🐐.`
							console.info(startedMessage);

							success = await migration.migrate();

						} catch (err) {
							const errorMessage =
								`ERROR: Attempting to migrate from version '${currentPrimeVersion}' to  version '${endMigrationVersion}' \
 but failed at Migration ${migration.version} as an error was thrown. \
 Some 🐐 goats 🐐 were lost. See console for more details.`;
							ui.notifications.error(errorMessage);
							console.error(errorMessage);
							console.error(err);
							throw(err);
						}

						if (success) {
							const message = `Migration ${migration.version} successful, 🐐 goats 🐐 were herded.`
							ui.notifications.info(message);
							console.info(message);

							await game.settings.set("prime", CURRENT_PRIME_VERSION_KEY, migration.version);
						} else {
							const errorMessage =
								`ERROR: Attempting to migrate from version '${currentPrimeVersion}' to version '${endMigrationVersion}' \
but failed at Migration ${migration.version}. \
Some 🐐 goats 🐐 were lost. See console for more details.`;
							ui.notifications.error(errorMessage);
							console.error(errorMessage);
							throw(errorMessage);
						}
					} else {
						const errorMessage =
							`WARNING: Attempting to migrate from version '${currentPrimeVersion}' to version '${endMigrationVersion}' \
but unable to migrate ${migration.version} because: ${reason}. \
🐐 goats 🐐 unharmed.`;
						ui.notifications.warn(errorMessage);
						console.warn(errorMessage);
						return;
					}
				}

				const message = "All migrations are now complete, the 🐐 goats 🐐 are back in control."
				ui.notifications.info(message);
			}
		} finally {
			await PrimeDataMigrationManager.removeMigratingFlag();
		}
	}

}