export class PrimeSettingsManager {
	static addSettings()
	{
		// Store the version at the time of world creation
		//const currentVersion = game.system.data.version;
		game.settings.register("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", {
			name: "System Migration Version",
			scope: "world",
			config: false,
			type: String,
			default: ""
		});
	}
}