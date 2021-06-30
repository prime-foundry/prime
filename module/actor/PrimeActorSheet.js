import {PrimeTables} from "../prime_tables.js";
import {ItemCardUI} from "../item/item_card_ui.js";
import {ItemDragSort} from "../item/item_drag_sort.js";
import Prime from "../components/Prime.js";
import PrimeController from "../util/PrimeController.js";

export class PrimeActorSheet extends ActorSheet {
    static hooksAdded = false;
    resizeOccuring = false;
    actorSheetMeasureTimer = false;
    updateWidthClassInterval = 50;

    //bulkUpdatingOwnedItems = false;
    currentItemSortList = null;

    /** @override */
    static get defaultOptions() {
        const superOptions = super.defaultOptions;

        if (!this.hooksAdded) {
            this.addHooks();
            this.hooksAdded = true;
        }

        const isGMClass = game.user.isGM ? 'userIsGM' : 'userIsNotGm';

        const actorConfig =
            {
                classes: ["primeSheet", "primeCharacterSheet", "sheet", "actor", isGMClass],
                template: "systems/prime/templates/actor/actor-sheet.html",
                width: 775,
                height: 765,
                tabs: [
                    {
                        navSelector: ".sheet-tabs",
                        contentSelector: ".sheet-body",
                        initial: "statistics"
                    }
                ],
            }

        return mergeObject(superOptions, actorConfig);
    }

    static addHooks() {
        Hooks.on("preUpdateActor", function (actorData, changeData, options, maybeUpdateID) {
            if (changeData.data && changeData.data.actionPoints && changeData.data.actionPoints.lastTotal && !changeData.data.actionPoints.value && changeData.data.actionPoints.value !== 0) {
                return false;
            }
            if (changeData.actionPoints && Array.isArray(changeData.actionPoints) && !changeData.data && !changeData.name && !changeData.img && (changeData.token && !changeData.token.img)) {
                return false;
            }

            return true;
        });
    }


    getActorData(data = super.getData()) {
        return data.data;
    }

    getActorProperties(data = super.getData()) {
        return this.getActorData(data).data;
    }

    getActionPoints(data = super.getData()) {
        return this.getActorProperties(data).actionPoints;
    }

    async _render(force = false, options = {}) {
        //if (!this.bulkUpdatingOwnedItems)
        //{
        return await super._render(force, options);
        //}
    }

    async updateIfDirty(data) {
        if (data.markedDirty) {
            data.markedDirty = false;
            await this.actor.update(data.data);
            return true;
        }
        return false;
    }

    getPrimeController(){
        if(!this._primeController){
            this._primeController = new PrimeController(this);
        }
        return this._primeController;
    }

    /** @override */
    getData(options) {
        // because we don't want an infinite loop, we ensure we use only the super data, to fetch actor data and properties.
        const data = super.getData(options);
        const actorProperties = this.getActorProperties(data);
        data.prime = new Prime({actor:this.actor}, this, data);

        data.dtypes = ["String", "Number", "Boolean"];

        data.characterNameClass = this.getCharacterNameClass(data.actor.name);
        data.isFromTokenClass = "";
        if (this.actor.isToken) {
            data.isFromTokenClass = "isCloneActor";
        }

        //var a = data.actor.permission
        data.actorProperties = actorProperties;
       // data.currentOwners = this.actor.getCurrentOwners();
       data.combinedResilience = this.actor.getCombinedResilience();
       data.combinedPsyche = this.actor.getCombinedPsyche();

      //  data.typeSorted = this.actor.getTypeSortedPrimesAndRefinements();

        data.itemTables = PrimeTables.cloneAndTranslateTables("items");
        data.actorTables = PrimeTables.cloneAndTranslateTables("actor");

        data.filteredItems = this.actor.getProcessedItems();

        data.inventoryItems = this.getInventoryItems(data.filteredItems);

        data.isV2CharacterClass = (actorProperties.sheetVersion == "v2.0") ? "characterSheetV2" : "";

        if (data.filteredItems["perk"]) {
            this.currentItemSortList = actorProperties.perkOrder || {};
            data.perks = data.filteredItems["perk"].sort(this.sortByItemOrder.bind(this));
        } else {
            data.perks = [];
        }

        data.sortedActions = this.actor.getSortedActions();

        return data;
    }

    getCharacterNameClass(whatName) {
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d');
        canvasContext.font = "34px Signika";

        const nameText = canvasContext.measureText(whatName);
        const nameWidth = nameText.width;

        // 215 is width of name field on default open.
        if (nameWidth <= 180) {
            return "largestNameFont";
        } else if (nameWidth > 180 && nameWidth <= 205) {
            return "largeNameFont";
        } else if (nameWidth > 205 && nameWidth <= 320) {
            return "mediumNameFont";
        } else if (nameWidth > 320 && nameWidth <= 450) {
            return "smallNameFont";
        } else {
            return "tinyNameFont";
        }
    }

    getInventoryItems(filteredItems) {
        var combinedItems = [];

        if (filteredItems["melee-weapon"]) {
            combinedItems = combinedItems.concat(filteredItems["melee-weapon"]);
        }
        if (filteredItems["ranged-weapon"]) {
            combinedItems = combinedItems.concat(filteredItems["ranged-weapon"]);
        }
        if (filteredItems["armour"]) {
            combinedItems = combinedItems.concat(filteredItems["armour"]);
        }
        if (filteredItems["shield"]) {
            combinedItems = combinedItems.concat(filteredItems["shield"]);
        }
        if (filteredItems["item"]) {
            combinedItems = combinedItems.concat(filteredItems["item"]);
        }

        this.currentItemSortList = this.getActorProperties().inventoryOrder || {};
        combinedItems = combinedItems.sort(this.sortByItemOrder.bind(this));

        return combinedItems;
    }

    sortByItemOrder(itemA, itemB) {
        const itemAPosition = this.currentItemSortList[itemA._id];
        const itemBPosition = this.currentItemSortList[itemB._id];

        if ((!itemAPosition && itemAPosition !== 0) || itemAPosition == -1)	// Sorting data is missing or not generated yet - leave with initial order
        {
            return 0;
        }

        if (itemAPosition < itemBPosition) {
            return -1;
        }
        if (itemAPosition > itemBPosition) {
            return 1;
        }

        return 0;
    }

    async burnSoulPoint() {
        const data = this.getData();
        data.prime.actor.soul.burn();
        const messageContent = 'A Soul Point Has Been Burnt';
        const alias = `${data.prime.user.name}: ${data.prime.actor.name}`;
        const speaker = ChatMessage.getSpeaker({actor: data.actor, alias});
        let chatData = {
            speaker,
            user: game.user._id,
            type: CONST.CHAT_MESSAGE_TYPES.IC,
            sound: CONFIG.sounds.combat,
            content: messageContent,
        };
        CONFIG.ChatMessage.entityClass.create(chatData);
        await this.updateIfDirty(data);
    }

    statChanged(event) {
        const statDOMObject = $(event.delegateTarget);
        const isItemStat = statDOMObject.data("itemstat");
        if (isItemStat) {
            const statKey = statDOMObject.data("itemid");

            const statItem = this.getActorData().items.get(statKey);

            statItem.data.data.value = statDOMObject.val();
            this.entity.updateOwnedItem(statItem.data);
        }
    }

    toggleSheetEditMode() {
        this.element.toggleClass("sheetEditable");
    }

    toggleValueEditMode(event) {
        const outerWrapper = $(event.delegateTarget);
        const valueWrapper = outerWrapper.find(".valueWrapper");
        if (!valueWrapper.hasClass("valueEditable")) {
            var input = valueWrapper.find("input");
            input.focus();
            input.select();
            input.data("lastValue", input.val());
        }
        outerWrapper.toggleClass("valueEditable");
        valueWrapper.toggleClass("valueEditable");
        //this.element.toggleClass("sheetEditable");
    }

    checkPreventClose(event) {
        var valueWrapper = $(event.delegateTarget);
        if (valueWrapper.hasClass("valueEditable")) {
            event.stopPropagation();
        }
    }

    validateNumber(event) {
        const input = $(event.delegateTarget);
        const value = input.val();
        let parsed = parseInt(value);
        if (!isNaN(parsed)) {
            const min = parseInt(input.data("min"));
            const max = parseInt(input.data("max"));
            if ((min || min === 0) && parsed < min) {
                parsed = min;
            }
            if ((max || max === 0) && parsed > max) {
                parsed = max;
            }
            if (parsed != value) {
                input.val(parsed);
            }
        } else if (input.data("lastValue")) {
            input.val(input.data("lastValue"));
        } else {
            input.val(input.data("min"));
        }
    }

    resizeUpdateStart(event) {
        this.resizeOccuring = true;
        this.createWidthUpdateTimer();
    }

    createWidthUpdateTimer() {
        if (this.resizeOccuring) {
            this.actorSheetMeasureTimer = window.setTimeout(this.updateWidthClasses.bind(this), this.updateWidthClassInterval);
        } else {
            this.clearMeasureTimer();
        }
    }

    updateWidthClasses() {
        if (this.position.width <= 665) {
            this.element.addClass("narrowWidth");
            this.element.removeClass("mediumWidth");
            this.element.removeClass("wideWidth");
        } else if (this.position.width > 665 && this.position.width <= 995) {
            this.element.removeClass("narrowWidth");
            this.element.addClass("mediumWidth");
            this.element.removeClass("wideWidth");
        } else {
            this.element.removeClass("narrowWidth");
            this.element.removeClass("mediumWidth");
            this.element.addClass("wideWidth");
        }
        this.createWidthUpdateTimer();
    }

    resizeUpdateEnd(event) {
        this.resizeOccuring = false;
        this.updateWidthClasses()
    }

    clearMeasureTimer() {
        if (this.actorSheetMeasureTimer) {
            window.clearInterval(this.actorSheetMeasureTimer);
            this.actorSheetMeasureTimer = false;
        }
    }

    clearValueEditMode(event) {
        const valueWrappers = $(".valueEditable");
        valueWrappers.toggleClass("valueEditable");
    }


    deleteItem(event) {
        const deleteLink = $(event.delegateTarget);
        const itemID = deleteLink.data("item-id");
        this.actor.deleteOwnedItem(itemID);
    }

    openStatItem(event) {
        const statItemLink = $(event.delegateTarget);

        let item;
        const sourceKey = statItemLink.data("sourcekey");
        item = ItemDirectory.collection.get(sourceKey);

        if (item.data.data.customisable) {
            const itemID = statItemLink.data("item-id");
            item = this.getActorData().items.get(itemID);
        }

        if (item) {
            const itemSheet = item.sheet;

            if (itemSheet.rendered) {
                itemSheet.maximize();
                itemSheet.bringToTop();
            } else {
                itemSheet.render(true);
            }
        } else {
            console.log()
        }
    }


    showOwnedItem(event) {
        event.preventDefault();
        const titleLink = $(event.delegateTarget);
        const itemID = titleLink.data("item-id");

        let item = this.getActorData().items.get(itemID);
        if (!item) {
            item = ItemDirectory.collection.get(itemID);
        }

        const itemSheet = item.sheet;

        if (itemSheet.rendered) {
            itemSheet.maximize();
            itemSheet.bringToTop();
        } else {
            itemSheet.render(true);
        }
    }

    attackWithWeapon(event) {
        const titleLink = $(event.delegateTarget);
        const weaponID = titleLink.data("weapon-id");
        const weapon = this.getActorData().items.get(weaponID);
        alert("Attack with: " + weapon.name)
    }

    async updateWornArmour(event) {
        const titleLink = $(event.delegateTarget);
        const armourID = titleLink.data("armour-id");
        const armour = this.getActorData().items.get(armourID);

        armour.data.data.isWorn = !armour.data.data.isWorn;

        //var result = await armour.update(armour.data);
        this.document.updateEmbeddedDocuments(armour.data);

        //this.entity.updateWornItemValues();
    }


    /** @override */
    activateListeners(html) {
        // const sheetHtml = html.find(`#primeactorsheet${this.appId}`)
        super.activateListeners(html);
        PrimeController.initializeForm(html, this);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        html.find(".statInput").change(this.statChanged.bind(this));

        html.find(".toggleCharacterEditing").click(this.toggleSheetEditMode.bind(this));
        html.find(".toggleCharacterLocked").click(this.toggleSheetEditMode.bind(this));

        html.find(".soulAndXP .burnSoulpoint").click(this.burnSoulPoint.bind(this));

        html.find(".primeWrapper, .refinementWrapper").dblclick(this.toggleValueEditMode.bind(this));
        html.find(".primeWrapper, .refinementWrapper").click(this.checkPreventClose.bind(this));
        html.find(".showStatInfoIcon").click(this.openStatItem.bind(this));

        html.find("input[data-dtype='Number']").change(this.validateNumber.bind(this));

        html.click(this.clearValueEditMode.bind(this));

        const resizeHandle = html.parent().parent().find(".window-resizable-handle");

        resizeHandle.mousedown(this.resizeUpdateStart.bind(this));
        $(document).mouseup(this.resizeUpdateEnd.bind(this));
        resizeHandle.click(this.resizeUpdateEnd.bind(this));

        html.find(".deleteItemIcon").click(this.deleteItem.bind(this));
        html.find(".itemTitle").click(this.showOwnedItem.bind(this));

        html.find(".attackWithWeapon").click(this.attackWithWeapon.bind(this));
        html.find(".armourWornCheckbox").click(this.updateWornArmour.bind(this));

        const perkWrapper = html.find(".perksOuterWrapper");
        ItemCardUI.bindEvents(perkWrapper);
        ItemDragSort.bindEvents(perkWrapper, ".itemCard", true, false, true, this.updateSortOrder.bind(this), "perk");

        const actionWrapper = html.find(".actionsHolder");
        ItemCardUI.bindEvents(actionWrapper);

        const inventoryWrapper = html.find(".generalItems");
        if (inventoryWrapper.length > 0) {
            ItemDragSort.bindEvents(inventoryWrapper, ".inventoryItem", false, true, false, this.updateSortOrder.bind(this), "inventory");
        }

        this.postActivateListeners(html);
    }

    updateSortOrder(itemIndex, insertAfterIndex, itemType) {
        //console.log("I would insert item '" + itemIndex + "' after item '" + insertAfterIndex + "'");
        //a = b;
        const processedItems = this.document.getProcessedItems();

        const itemsToSort = itemType === "inventory" ? this.getInventoryItems(processedItems) : processedItems[itemType];

        const itemOrder = {};

        if (itemsToSort) {
            // If we're going to be shrinking the array before the
            // insertion point, we need to increase the insert index
            // to compensate.
            if (insertAfterIndex >= itemIndex) {
                insertAfterIndex--;
            }

            this.currentItemSortList = this.object.data.data[itemType + "Order"] || {};

            // Should match initial page order after this sort
            itemsToSort.sort(this.sortByItemOrder.bind(this));
            let itemToReInsert = itemsToSort.splice(itemIndex, 1)[0];
            itemsToSort.splice(insertAfterIndex, 0, itemToReInsert);

            //this.bulkUpdatingOwnedItems = true;
            var count = 0;
            while (count < itemsToSort.length) {
                let itemData = itemsToSort[count];

                //let itemClass = this.object.items.get(itemData._id);
                //itemClass.data.data.position = count;
                itemOrder[itemData._id] = count
                //await this.entity.updateOwnedItem(itemClass.data);
                console.log("Count: " + count);
                count++;
            }

            let updateData = {};
            updateData.data = {}
            updateData.data[itemType + "Order"] = itemOrder;

            this.object.update(updateData)

            //this.bulkUpdatingOwnedItems = false;
            //this.render();
        } else {
            console.error("ERROR: Unable to find items of type '" + itemType + "' in updateSortOrder(). processedItems: ", processedItems);
        }
    }

    async postActivateListeners(html) {
        const data = this.getData();
        const actionPoints = data.prime.actor.actionPoints;

        html.find(".fillAnimation").removeClass("fillAnimation");
        html.find(".emptyAnimation").removeClass("emptyAnimation");

        if (actionPoints.lastTotal != actionPoints.value) {
            actionPoints.lastTotal = actionPoints.value;
            await this.updateIfDirty(data);
        }
    }
}