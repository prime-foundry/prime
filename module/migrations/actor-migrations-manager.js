export class ActorMigrationsManager
{
    static async createV2Clones()
    {
        ui.notifications.info("Creating V2 character clones");
        const unclonedV1Characters = ActorMigrationsManager.getUnclonedV1Characters();
        const newV2Clones = ActorMigrationsManager.cloneAndUpgradeToV2(unclonedV1Characters);
        ActorMigrationsManager.createNewCharacters(newV2Clones);
    }

    static async removeV2Clones()
    {
        if (window.confirm("Are you 100% sure you want to remove all existing v2 cloned characters? This action cannot be easily undone."))
        {
            ui.notifications.info("Culling the clones");
            await ActorMigrationsManager.removeCharacters("v2.0", true);
        }
    }

    static async removeV1Characters()
    {
        if (window.confirm("Are you 100% sure you want to remove all existing v1 characters? This action cannot be easily undone."))
        {
            ui.notifications.info("Culling old v1 characters.");
            await ActorMigrationsManager.removeCharacters("v1.0", false);
        }
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

