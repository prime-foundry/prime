import { PrimeTables } from "../prime_tables.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class PrimeItemSheet extends ItemSheet
{
    // eslint-disable-next-line constructor-super
    constructor(data)
    {
        super(data);
        // eslint-disable-next-line no-this-before-super
        this.checkboxGroupStates = {};

    }

    /** @override */
    static get defaultOptions()
    {
        let isGMClass = "userIsNotGm";
        if (game.user.isGM)
        {
            isGMClass = "userIsGM";
        }

        var primeItemOptions = {
            classes: ["primeSheet", "primeItemSheet", "sheet", isGMClass],
            width: 420,
            height: 550,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "description",
                },
            ],
        };

        return mergeObject(super.defaultOptions, primeItemOptions);
    }

    /** @override */
    get template()
    {
        const path = "systems/prime/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /** @override */
    getData()
    {
        let sheetData = super.getData();
        sheetData.itemTables = PrimeTables.cloneAndTranslateTables("items");
        sheetData.coreTables = PrimeTables.cloneAndTranslateTables("core");
        sheetData.perkTables = PrimeTables.cloneAndTranslateTables("perks");
        sheetData.actionTables = PrimeTables.cloneAndTranslateTables("actions");
        sheetData.actorTables = PrimeTables.cloneAndTranslateTables("actor");

        this.addItemTypeData(sheetData);
        sheetData.checkboxGroupStates = this.checkboxGroupStates;

        sheetData.isOwned = this.item.isOwned;
        sheetData.owningCharacterName = null;

        if (this.actor)
        {
            sheetData.owningCharacterName = this.actor.name;
        }

        sheetData.descriptionHTML = this.item.system.description;
        sheetData.settingDescriptionHTML = this.item.system.settingDescription;

        sheetData.id = this.item.id;
        sheetData.actor = this.actor;
        sheetData.system = this.item.system;

        const source = this.item.toObject();
        sheetData.source = source.system;

        return sheetData;
    }

    addItemTypeData(sheetData)
    {
        sheetData.bonuses = this.getEffectsRenderableData("bonus");
        switch (sheetData.item.type)
        {
        case "item":
        case "prime":
        case "refinement":
            break;
        case "melee-weapon":
        case "shield":
            sheetData.checkboxGroups = this.compileWeaponCheckboxGroups(sheetData, "melee");
            break;
        case "ranged-weapon":
            sheetData.checkboxGroups = this.compileWeaponCheckboxGroups(sheetData, "ranged");
            this.addRangeCatergoryTitles(sheetData);
            break;
        case "armour":
            sheetData.checkboxGroups = this.compileArmourCheckboxGroups(sheetData);
            break;
        case "perk":
            sheetData.prerequisites = this.getEffectsRenderableData("prerequisite");
            break;
        case "action":
            sheetData.effects = this.getEffectsRenderableData("actionEffect");
            break;
        default:
            console.warn(
                "Unknown item type of '" +
                    sheetData.item.type +
                    "' found in addItemTypeData()."
            );
            break;
        }
    }

    compileWeaponCheckboxGroups(sheetData, subTypeKey)
    {
        let woundList = this.cloneAndAddSelectedState(
            sheetData.actorTables.woundConditions,
            "wound-conditions"
        );
        let keywordsList = this.cloneAndAddSelectedState(
            sheetData.itemTables.weapons.keywords,
            "keywords"
        );

        let actionsList = this.getWeaponComboActionData();

        return { wounds: woundList, keywords: keywordsList, actions: actionsList };
    }

    compileArmourCheckboxGroups(sheetData)
    {
        let keywordsList = this.cloneAndAddSelectedState(
            sheetData.itemTables.armour.keywords,
            "keywords"
        );
        let untrainedPenaltyList = this.cloneAndAddSelectedState(
            sheetData.itemTables.armour.untrainedPenalities,
            "untrained"
        );

        return { keywords: keywordsList, untrainedPenalty: untrainedPenaltyList };
    }

    getWeaponComboActionData()
    {
        var weaponComboActions = PrimeTables.getActionKeysAndTitles(false, [
            "weaponCombo",
        ]);

        let checkboxGroupObject = {
            optionsData: $.extend(true, [], weaponComboActions),
            selectedItems: [],
        };

        var effectDataArray = this.getEffectsRenderableData("checkbox-actions");

        let effectData = false;
        if (effectDataArray.length == 1)
        {
            effectData = effectDataArray[0];
        }

        var count = 0;

        while (count < checkboxGroupObject.optionsData.length)
        {
            let currOption = checkboxGroupObject.optionsData[count];

            if (effectData)
            {
                currOption.checked = effectData.flags[currOption.key];
                currOption.effectID = effectData.id;
            }
            else
            {
                currOption.checked = false;
                currOption.effectID = "";
            }

            let combinedDescription = false;

            var currActionData = currOption.source.system;
            if (currActionData.description || currActionData.settingDescription)
            {
                combinedDescription =
                    (currActionData.description || "") +
                    (currActionData.settingDescription || "");
                currOption.description = combinedDescription;
            }

            if (currOption.checked)
            {
                let selectedItemData = { title: currOption.title };
                selectedItemData.description = combinedDescription;
                checkboxGroupObject.selectedItems.push(selectedItemData);
            }
            count++;
        }

        if (checkboxGroupObject.selectedItems.length == 0)
        {
            checkboxGroupObject.selectedItems.push({ title: "none" });
        }

        return checkboxGroupObject;
    }

    getEffectsRenderableData(targetEffectType)
    {
        var effectData = [];
        var matchingEffectsCount = 0;
        this.item.effects.forEach((effect, key, effects) =>
        {
            if (effect.flags.effectType == targetEffectType)
            {
                matchingEffectsCount++;
                var effectDataForRender = this.getRenderableDataFromEffect(
                    effect,
                    targetEffectType,
                    matchingEffectsCount
                );
                effectData.push(effectDataForRender);
            }
        });

        return effectData;
    }

    getRenderableDataFromEffect(
        whatEffect,
        targetEffectType,
        matchingEffectsCount
    )
    {
        let renderableData = null;
        switch (targetEffectType)
        {
        case "bonus":
            renderableData = this.getRenderableBonusDataFromEffect(
                whatEffect,
                matchingEffectsCount
            );
            break;
        case "prerequisite":
            renderableData = this.getRenderablePrerequiristeDataFromEffect(
                whatEffect,
                matchingEffectsCount
            );
            break;
        case "actionEffect":
            renderableData = this.getRenderableActionDataFromEffect(
                whatEffect,
                matchingEffectsCount
            );
            break;
        case "checkbox-keywords":
        case "checkbox-untrained":
        case "checkbox-actions":
        case "checkbox-wound-conditions":
            renderableData =
                    this.getRenderableCheckboxGroupDataFromEffect(whatEffect);
            break;
        default:
            console.warn(
                "Unknown item type of '" +
                    targetEffectType +
                    "' found in getRenderableDataFromEffect(). Effect: ".whatEffect
            );
            break;
        }
        return renderableData;
    }

    getRenderableBonusDataFromEffect(whatEffect, matchingEffectsCount)
    {
        var dynamicDataForBonusTarget = this.getDynamicDataForBonusTarget(
            whatEffect.flags.effectSubType
        );

        var renderableEffectData = {
            effectID: whatEffect.id,
            effectSubType: whatEffect.flags.effectSubType,
            dynamicDataForEffectTarget: dynamicDataForBonusTarget,
            path: whatEffect.flags.path,
            value: whatEffect.flags.value,
            actualCount: matchingEffectsCount,
        };

        return renderableEffectData;
    }

    getDynamicDataForBonusTarget(perkBonusType)
    {
        var dynamicDataForBonusTarget = [];
        switch (perkBonusType)
        {
        case "situationalPrime":
            dynamicDataForBonusTarget = PrimeTables.getPrimeKeysAndTitles();
            break;
        case "situationalRefinement":
            dynamicDataForBonusTarget = PrimeTables.getRefinementKeysAndTitles();
            break;
        case "extraAction":
            dynamicDataForBonusTarget = PrimeTables.getActionKeysAndTitles(true);
            break;
        case "actionPointBonus":
            dynamicDataForBonusTarget = PrimeTables.getActionKeysAndTitles();
            break;
        case "actorStatBonus":
            dynamicDataForBonusTarget = PrimeTables.cloneAndTranslateTables(
                "actor.actorStatLookup"
            );
            break;
        case "externalStatBonus":
            dynamicDataForBonusTarget = PrimeTables.cloneAndTranslateTables(
                "perks.externalStatLookup"
            );
            break;
        case "misc":
            dynamicDataForBonusTarget = PrimeTables.cloneAndTranslateTables(
                "perks.miscBonusLookup"
            );
            break;
        default:
            console.error(
                "Unknown perk type of '" +
                    perkBonusType +
                    "' found in getDynamicDataPathForBonus()."
            );
            break;
        }

        return dynamicDataForBonusTarget;
    }

    getRenderablePrerequiristeDataFromEffect(whatEffect, matchingEffectsCount)
    {
        var dynamicDataForPrerequisiteTarget =
            this.getDynamicDataForPrerequisiteTarget(
                whatEffect.flags.effectSubType
            );

        var renderableEffectData = {
            effectID: whatEffect.id,
            effectSubType: whatEffect.flags.effectSubType,
            dynamicDataForEffectTarget: dynamicDataForPrerequisiteTarget,
            path: whatEffect.flags.path,
            value: whatEffect.flags.value,
            actualCount: matchingEffectsCount,
        };

        return renderableEffectData;
    }

    getDynamicDataForPrerequisiteTarget(perkPrereqiusiteType)
    {
        var dynamicDataForPrerequisiteTarget = [];
        switch (perkPrereqiusiteType)
        {
        case "minimumPrime":
            dynamicDataForPrerequisiteTarget = PrimeTables.getPrimeKeysAndTitles();
            break;
        case "minimumRefinement":
            dynamicDataForPrerequisiteTarget =
                    PrimeTables.getRefinementKeysAndTitles();
            break;
        case "minimumStat":
            dynamicDataForPrerequisiteTarget = PrimeTables.cloneAndTranslateTables(
                "actor.actorStatLookup"
            );
            break;
        case "maximumPrime":
            dynamicDataForPrerequisiteTarget = PrimeTables.getPrimeKeysAndTitles();
            break;
        case "maximumRefinement":
            dynamicDataForPrerequisiteTarget =
                    PrimeTables.getRefinementKeysAndTitles();
            break;
        case "maximumStat":
            dynamicDataForPrerequisiteTarget = PrimeTables.cloneAndTranslateTables(
                "actor.actorStatLookup"
            );
            break;
        case "otherPerk":
            dynamicDataForPrerequisiteTarget =
                    PrimeTables.getItemKeysAndTitlesByType("perk");
            break;
        default:
            console.error(
                "Unknown perk type of '" +
                    perkPrereqiusiteType +
                    "' found in getDynamicDataForPrerequisiteTarget()."
            );
            break;
        }

        return dynamicDataForPrerequisiteTarget;
    }

    getRenderableActionDataFromEffect(whatEffect, matchingEffectsCount)
    {
        var dynamicDataForActionTarget = this.getDynamicDataForActionTarget(
            whatEffect.flags.effectSubType
        );

        var renderableEffectData = {
            effectID: whatEffect.id,
            effectSubType: whatEffect.flags.effectSubType,
            dynamicDataForEffectTarget: dynamicDataForActionTarget,
            path: whatEffect.flags.path,
            value: whatEffect.flags.value,
            actualCount: matchingEffectsCount,
        };

        return renderableEffectData;
    }

    getRenderableCheckboxGroupDataFromEffect(whatEffect)
    {
        var returnData = {
            id: whatEffect.id,
            flags: whatEffect.flags,
        };

        return returnData;
    }

    getDynamicDataForActionTarget(actionSubType)
    {
        var dynamicDataForActionTarget = [];
        switch (actionSubType)
        {
        case "move":
        case "meleeAttack":
        case "rangedAttack":
        case "meleeBlock":
        case "rangedBlock":
        case "magic":
        case "misc":
            dynamicDataForActionTarget = PrimeTables.cloneAndTranslateTables(
                "actions.miscBonusLookup"
            );
            break;
        case "gainPoints":
            dynamicDataForActionTarget = PrimeTables.cloneAndTranslateTables(
                "actor.actorStatLookup"
            );
            break;
        default:
            console.error(
                "Unknown perk type of '" +
                    actionSubType +
                    "' found in getDynamicDataForActionTarget()."
            );
            break;
        }

        return dynamicDataForActionTarget;
    }

    cloneAndAddSelectedState(whatRawOptionsArray, whatEffectKey)
    {
        let checkboxGroupObject = {
            optionsData: $.extend(true, [], whatRawOptionsArray),
            selectedItems: [],
        };

        var effectDataArray = this.getEffectsRenderableData(
            "checkbox-" + whatEffectKey
        );


        let effectData = false;
        if (effectDataArray.length == 1)
        {
            effectData = effectDataArray[0];
        }
        var count = 0;

        while (count < checkboxGroupObject.optionsData.length)
        {
            let currOption = checkboxGroupObject.optionsData[count];

            if (effectData)
            {
                currOption.checked = effectData.flags[currOption.key];
                currOption.effectID = effectData.id;
            }
            else
            {
                currOption.checked = false;
                currOption.effectID = "";
            }

            if (currOption.checked)
            {
                let selectedItemData = { title: currOption.title };
                if (currOption.description)
                {
                    selectedItemData.description = currOption.description;
                }
                checkboxGroupObject.selectedItems.push(selectedItemData);
            }
            count++;
        }

        if (checkboxGroupObject.selectedItems.length == 0)
        {
            checkboxGroupObject.selectedItems.push({ title: "none" });
        }

        return checkboxGroupObject;
    }

    addRangeCatergoryTitles(sheetData)
    {
        // Annoyingly, these need to stay as .data references for the moment - the `let sheetData = super.getData();`
        // call returns them that way :-/
        for (let key in sheetData.data.system.ranges)
        {
            sheetData.data.system.ranges[key].title =
                sheetData.itemTables.weapons.rangeCatergories[key];
        }
    }

    async _updateObject(event, data)
    {
        this.checkMetaData(data);
        await super._updateObject(event, data);
    }

    checkMetaData(sheetData)
    {
        const baseData = super.getData();
        if (!baseData.data.system.creator)
        {
            this.addMetaData(sheetData);
        }
        else
        {
            this.updateMetaData(sheetData);
        }
    }

    addMetaData(sheetData)
    {
        sheetData["system.creator"] = game.users.get(game.userId).name;
        sheetData["system.creatorID"] = game.userId;

        sheetData["system.updater"] = game.users.get(game.userId).name;
        sheetData["system.updaterID"] = game.userId;

        var dateString = this.getDateString();

        sheetData["system.created"] = dateString;
        sheetData["system.updated"] = dateString;

        sheetData["system.sourceKey"] = this.item._id;
        //game.users.get(game.userId);
    }

    updateMetaData(sheetData)
    {
        sheetData["system.updater"] = game.users.get(game.userId).name;
        sheetData["system.updaterID"] = game.userId;

        var dateString = this.getDateString();
        sheetData["system.updated"] = dateString;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {})
    {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    getDateString()
    {
        //const timezone = new Date().getTimezoneOffset();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const dateString = new Date().toLocaleDateString("en-gb", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: timezone,
        });
        return dateString;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html)
    {
        super.activateListeners(html);

        const groupTitles = html.find(".checkboxGroupTitle");
        groupTitles.click(this.toggleCheckboxGroup.bind(this));

        html.find(".checkboxGroup").change(this.processCheckboxGroup.bind(this));

        html
            .find(".effectFormElement")
            .change(this.perkEffectFormElementChanged.bind(this));

        if (!this.item.isOwned)
        {
            html.find(".removeEffectIcon").click(this.removeEffect.bind(this));
            html.find(".addEffectIcon").click(this.addBlankEffect.bind(this));
        }

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. would go here.
    }

    async processCheckboxGroup(event)
    {
        // data-path="keywords"
        event.preventDefault();
        event.stopPropagation();

        const formElement = $(event.delegateTarget);
        const effectID = formElement.data("effect-id");
        const checkboxType = formElement.data("group-type");
        const checkboxKey = formElement.val();
        const checked = formElement[0].checked;

        if (effectID)
        {
            const updateData = { flags: {} };
            updateData.flags[checkboxKey] = checked;

            var effectToUpdate = await this.item.effects.get(effectID);
            await effectToUpdate.update(updateData);
        }
        else
        {
            var effectData = this.getBlankEffectByType(checkboxType);
            effectData.flags[checkboxKey] = checked;

            await ActiveEffect.create(effectData, this.item);
        }
    }

    toggleCheckboxGroup(event)
    {
        const checkboxGroupTitle = $(event.delegateTarget);
        const checkboxGroupID = checkboxGroupTitle.data("checkbox-group");
        const outerWrapper = checkboxGroupTitle.parent();
        const targetGroupWrapper = outerWrapper.find(
            ".checkboxGroupWrapper[data-checkbox-group='" + checkboxGroupID + "']"
        );

        if (!this.checkboxGroupStates[checkboxGroupID])
        {
            this.checkboxGroupStates[checkboxGroupID] = true;

            checkboxGroupTitle.addClass("expanded");
            checkboxGroupTitle.removeClass("collapsed");
            targetGroupWrapper.addClass("expanded");
            targetGroupWrapper.removeClass("collapsed");
        }
        else
        {
            this.checkboxGroupStates[checkboxGroupID] = false;

            checkboxGroupTitle.removeClass("expanded");
            checkboxGroupTitle.addClass("collapsed");
            targetGroupWrapper.removeClass("expanded");
            targetGroupWrapper.addClass("collapsed");
        }
    }

    async perkEffectFormElementChanged(event)
    {
        event.preventDefault();
        event.stopPropagation();

        const formElement = $(event.delegateTarget);
        const effectID = formElement.data("effect-id");
        const flagKey = formElement.data("effect-flag-key");

        const updateData = { flags: {} };
        updateData.flags[flagKey] = formElement.val();

        // If we've changed effect subtype, reset the data path as it will be meaningless.
        if (flagKey == "effectSubType")
        {
            updateData.flags.path = "";
        }

        var effectToUpdate = await this.item.effects.get(effectID);
        var result = await effectToUpdate.update(updateData);

        console.log("Perk update result: ", result);
    }

    async removeEffect(event)
    {
        event.preventDefault();
        const removeIcon = $(event.delegateTarget);
        const effectID = removeIcon.data("effect-id");

        var effectToDelete = this.item.effects.get(effectID);

        effectToDelete.delete();
    }

    async addBlankEffect(event)
    {
        event.preventDefault();
        const removeIcon = $(event.delegateTarget);
        const effectType = removeIcon.data("effect-type");

        var effectData = this.getBlankEffectByType(effectType);

        //var result = await ActiveEffect.create(effectData, this.item);
        var result = ActiveEffect.create({
            ...effectData,
            origin: this.item.id
        }, { parent: this.item });

        console.log("Created? Result: ", result);
    }

    getBlankEffectByType(effectType)
    {
        var baseEffectData = {
            icon: "icons/svg/aura.svg",
            origin: this.item.uuid,
            flags: {
                effectType: effectType,
                value: 0,
            },
        };

        switch (effectType)
        {
        case "bonus":
            baseEffectData.label = "Effect";
            baseEffectData.flags.effectSubType = "situationalPrime";
            baseEffectData.flags.path = "end";
            break;
        case "prerequisite":
            baseEffectData.label = "Perk prerequisite";
            baseEffectData.flags.effectSubType = "minimumPrime";
            baseEffectData.flags.path = "end";
            break;
        case "actionEffect":
            baseEffectData.label = "Action effect";
            baseEffectData.flags.effectSubType = "move";
            baseEffectData.flags.path = "null";
            break;
        case "checkbox-keywords":
            baseEffectData.label = "Checkbox group - Keywords";
            break;
        case "checkbox-untrained":
            baseEffectData.label = "Checkbox group - Untrained penalities";
            break;
        case "checkbox-actions":
            baseEffectData.label = "Checkbox group - Custom weapon actions";
            break;
        case "checkbox-wound-conditions":
            baseEffectData.label = "Checkbox group - Wound conditions";
            break;
        default:
            console.error(
                "ERROR: Unknown effect type of '" +
                    effectType +
                    "' found in getBlankEffectByType()."
            );
            break;
        }

        return baseEffectData;
    }
}
