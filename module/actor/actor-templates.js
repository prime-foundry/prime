
export class PrimePCActorTemplates
{
    static selectedTemplateActorID = null;

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

            const itemsToCopy = this.getTemplateActorItemsToCopy(templateActor, targetActor);
        }
        else
        {
            ui.notifications.info("Please select a template first.");
        }
    }

    static getTemplateActorItemsToCopy(templateActor, targetActor)
    {
        const itemsToCopy = [];
        templateActor.items.forEach((item) =>
        {
            const targetHasItem = !!targetActor.getItemByName(item.name);
            if (!targetHasItem)
            {
                itemsToCopy.push(item);
            }
        });

        return itemsToCopy;
    }
}