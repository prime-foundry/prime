
export class PrimePCActorTemplates
{
    static selectedTemplateActorID = null;
    static lastEvent = null;

    static bindEvents(whatContainer)
    {
        whatContainer.find(".applyTemplateSelect").change(this.updateSelectedTemplateActor.bind(this));
        whatContainer.find(".applyTemplateButton").click(this.applyTemplateToActor.bind(this));
        whatContainer.find(".showTemplateActorButton").click(this.showTemplateActor.bind(this));
    }

    static getListOfTemplateActors()
    {
        const templateActors = [];
        Array.from(game.actors.values()).forEach((actor) =>
        {
            if (actor.system.metadata.isTemplate)
            {
                templateActors.push({name: actor.name, id: actor.id});
            }
        });
        return templateActors;
    }

    static updateSelectedTemplateActor(event)
    {
        this.selectedTemplateActorID = event.currentTarget.selectedOptions[0].value;
    }

    static showTemplateActor()
    {
        if (this.selectedTemplateActorID)
        {
            const actors = CONFIG.Actor.collection.instance;
            const actor = actors.get(this.selectedTemplateActorID);
            actor.sheet.render(true);
        }
    }

    static applyTemplateToActor(event)
    {
        if (this.selectedTemplateActorID)
        {
            const actors = CONFIG.Actor.collection.instance;
            const templateActor = actors.get(this.selectedTemplateActorID);
            const targetActor = actors.get(event.currentTarget.dataset.actorid);

            const { itemsToCopy, itemCopyMessage }= this.getTemplateActorItemsToCopy(templateActor, targetActor);
            const { statItemUpdates, statUpdateMessage } = this.getStatItemUpdates(templateActor, targetActor);

            const applyTemplateConfirmation = confirm(`The following changes will be made to the target template '${targetActor.name}'\n ${itemCopyMessage} ${statUpdateMessage}`);

            if (applyTemplateConfirmation)
            {
                targetActor.updateEmbeddedDocuments("Item", statItemUpdates).then(() =>
                {
                    targetActor.createEmbeddedDocuments("Item", itemsToCopy);
                });
            }
        }
        else
        {
            ui.notifications.info("Please select a template first.");
        }
    }

    static getTemplateActorItemsToCopy(templateActor, targetActor)
    {
        const itemsToCopyTitles = [];
        const itemsToCopy = [];
        let itemCopyMessage = "No items were found to be copied, or they already existed on the target actor.\n";
        templateActor.items.forEach((item) =>
        {
            const targetHasItem = !!targetActor.getItemByName(item.name);
            if (!targetHasItem)
            {
                itemsToCopyTitles.push(item.name);
                itemsToCopy.push(item.toObject());
            }
        });

        if (itemsToCopyTitles.length > 0)
        {
            itemCopyMessage = `The following items will be copied over: \n${itemsToCopyTitles.join(", ")}\n`;
        }

        return { itemsToCopy, itemCopyMessage };
    }

    static getStatItemUpdates(templateActor, targetActor)
    {
        const statItemUpdateTitles = [];
        const statItemUpdates = [];
        let statUpdateMessage = "No stats were found to be updated, or they were already found to be higher on the target actor.\n";
        templateActor.items.forEach((templateActorStatItem) =>
        {
            if (templateActorStatItem.type === "prime" || templateActorStatItem.type === "refinement")
            {
                const targetActorStat = targetActor.getItemByName(templateActorStatItem.name);
                // If it has the stat, and the value is lower, update it (otherwise it'll just be copied
                // across with the correct value).
                if (targetActorStat && targetActorStat.system.value < templateActorStatItem.system.value)
                {
                    statItemUpdateTitles.push(`${targetActorStat.name} (${targetActorStat.system.value} > ${templateActorStatItem.system.value})`);

                    const statUpdate = targetActorStat.toObject();
                    statUpdate.system.value = templateActorStatItem.system.value;
                    statItemUpdates.push( {...statUpdate} );
                }
            }
        });

        if (statItemUpdateTitles.length > 0)
        {
            statUpdateMessage = `The following stats will be copied over: \n${statItemUpdateTitles.join(", ")}\n`;
        }

        return { statItemUpdates, statUpdateMessage };
    }
}