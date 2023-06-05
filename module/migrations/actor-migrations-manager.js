export class ActorMigrationsManager
{
    static async createV2Clones()
    {
        ui.notifications.info("Creating V2 character clones");
        const unclonedV1Characters = ActorMigrationsManager.getUnclonedV1Characters();
        const newV2Clones = ActorMigrationsManager.cloneAndUpgradeToV2(unclonedV1Characters);
        ActorMigrationsManager.createNewCharacters(newV2Clones);
    }

    static async migrateV2ToNewStats()
    {
        ui.notifications.info("Migrating to new stat items");
        const unmappedStatV2Characters = ActorMigrationsManager.getUnmappedStatV2Characters();
        console.log(unmappedStatV2Characters);
        await ActorMigrationsManager.migrateSkills(unmappedStatV2Characters);
    }

    static async removeV2Clones()
    {
        if (window.confirm("Are you 100% sure you want to remove all existing v2 cloned characters? This action cannot be easily undone."))
        {
            ui.notifications.info("Culling the clones");
            await ActorMigrationsManager.removeCharacters("v2.0", true);
        }
    }

    static async removeV1LegacyCharacters()
    {
        if (window.confirm("Are you 100% sure you want to remove all existing v1 characters? This action cannot be easily undone."))
        {
            ui.notifications.info("Culling old v1 characters.");
            await ActorMigrationsManager.removeCharacters("v1.0", false);
        }
    }

    static async removeDuplicateStats()
    {
        game.actors.forEach(async (actor) =>
        {
            await actor.deDuplicateStats();
        });
    }

    static async removeTracesOfV2CloningProgramme()
    {
        ui.notifications.info("Scrubbing evidence of cloning process.");
        game.actors.forEach(async (actor) =>
        {
            if (actor.system.cloneSourceID)
            {
                const name = actor.name.replace(" V2", "");
                delete actor.system.cloneSourceID;
                await actor.update({system: actor.system, name});
            }
        });
        ui.notifications.info("Scrubbing complete?");
    }

    static async removeCharacters(actorVersion, removeClones)
    {
        const actorDeletionPromises = [];

        game.actors.forEach(async (actor) =>
        {
            if (actor.system.sheetVersion === actorVersion && ((removeClones && actor.system.cloneSourceID) || !removeClones))
            {
                const deletionPromise = actor.delete();
                actorDeletionPromises.push(deletionPromise);
            }
        });

        Promise.all(actorDeletionPromises).then(() =>
        {
            ui.notifications.info("Culling complete?");
        });

    }

    static getUnclonedV1Characters()
    {
        const v2ActorCloneSourceIDs = [];
        const v1Actors = game.actors.filter((actor) =>
        {
            if (actor.system.sheetVersion === "v1.0")
            {
                return true;
            }
            if (actor.system.sheetVersion === "v2.0" && actor.system.cloneSourceID)
            {
                v2ActorCloneSourceIDs.push(actor.system.cloneSourceID);
            }
            return false;
        });

        const unclonedV1Actors = v1Actors.filter((actor) =>
        {
            if (!v2ActorCloneSourceIDs.includes(actor.id))
            {
                return true;
            }
            return false;
        });

        return unclonedV1Actors;
    }

    static getUnmappedStatV2Characters()
    {
        const brokenV2Actors = game.actors.filter((actor) =>
        {
            if (actor.system.sheetVersion === "v2.0" && !actor.system.cloneSourceID)
            {
                try
                {
                    actor.getRefinements();
                }
                catch (err)
                {
                    console.log(err);
                    return true;
                }
            }
            return false;
        });

        return brokenV2Actors;
    }

    static cloneAndUpgradeToV2(actorsToClone)
    {
        const actorClones = actorsToClone.map((actor) =>
        {
            // toObject() is required otherwise Foundry tries to be smart about the clone :-/
            const newCloneData = actor.clone().toObject();
            this.upgradeToV2(newCloneData, actor.id);
            return newCloneData;
        });

        return actorClones;
    }

    static async migrateSkills(actorsToMigrate)
    {
        await actorsToMigrate.forEach(async function(actor)
        {
            await actor.migrateToNewStats();
        });
    }

    static upgradeToV2(actor, sourceID)
    {
        actor.name += " V2";
        actor.system.cloneSourceID = sourceID;
        actor.system.sheetVersion = "v2.0";
    }

    static async createNewCharacters(actorsToCreate)
    {
        const newActorCreationPromises = [];
        actorsToCreate.forEach(async (actor) =>
        {
            const newClonePromise = Actor.create(actor);
            newActorCreationPromises.push(newClonePromise);
        });

        Promise.all(newActorCreationPromises).then((/*newActors*/) => 
        {
            ui.notifications.info("Cloning (mostly) complete.");
        });
    }
}

