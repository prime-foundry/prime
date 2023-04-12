
export class ActorMigrationsManager {

    static async assessMigrationRequirements()
    {
        const unclonedV1Characters = this.getUnclonedV1Characters();
        if (unclonedV1Characters.length === 0)
        {
            this.removeV2Clones();
        }
        else
        {
            const newV2Clones = this.cloneAndUpgradeToV2(unclonedV1Characters);
            const newV2Characters = await this.createNewCharacters(newV2Clones);
        }

    }

    static removeV2Clones()
    {
        game.actors.filter((actor) =>
        {
            if (actor.system.sheetVersion === "v2.0" && actor.system.cloneSourceID) {
                actor.delete();
            }
        });
    }

    static getUnclonedV1Characters()
    {
        const v2ActorCloneSourceIDs = [];
        const v1Actors = game.actors.filter((actor) =>
        {
            if (actor.system.sheetVersion === "v1.0") {
                return true;
            }
            if (actor.system.sheetVersion === "v2.0" && actor.system.cloneSourceID) {
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
        const newActors = [];
        await actorsToCreate.forEach(async (actor) =>
        {
            const newClone = await Actor.create(actor);
            newActors.push(newClone);
        });

        console.log(newActors);
        return newActors;
    }

}
