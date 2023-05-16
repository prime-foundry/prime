export class ActorMigrationsManager 
{

    static async assessMigrationRequirements()
    {
        const unclonedV1Characters = this.getUnclonedV1Characters();
        if (unclonedV1Characters.length === 0)
        {
            ui.notifications.info("Culling the clones");
            await this.removeV2Clones();
        }
        else
        {
            ui.notifications.info("Creating V2 character clones");
            const newV2Clones = this.cloneAndUpgradeToV2(unclonedV1Characters);
            this.createNewCharacters(newV2Clones);
        }

    }

    static async removeV2Clones()
    {
        const actorDeletionPromises = [];

        game.actors.forEach(async (actor) =>
        {
            if (actor.system.sheetVersion === "v2.0" && actor.system.cloneSourceID)
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
