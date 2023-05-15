export class PrimeSettingsManager 
{
    static addSettings()
    {
        game.settings.register("prime", "notAutoIncrementedBeforeICanCheckItWorldVersionNumber", {
            name: "System Migration Version",
            scope: "world",
            config: false,
            type: String,
            default: ""
        });
    }
}