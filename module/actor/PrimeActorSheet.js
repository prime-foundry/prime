import {PrimeTables} from "../prime_tables.js";
import {ItemCardUI} from "../item/item_card_ui.js";
import {ItemDragSort} from "../item/item_drag_sort.js";

import {PrimeItemManager} from "../item/PrimeItemManager.js";
import {DynApplicationMixin} from "../util/DynFoundryMixins.js";
import {orderedSort} from "../util/support.js";

export class PrimeActorSheet extends DynApplicationMixin(ActorSheet) {
    static hooksAdded = false;
    resizeOccuring = false;
    actorSheetMeasureTimer = false;
    updateWidthClassInterval = 50;

    //bulkUpdatingOwnedItems = false;
    currentItemSortList = null;


    constructor(...args) {
        super(...args);
        Hooks.on('createItem', this.renderOnItemChange.bind(this));
        Hooks.on('updateItem', this.renderOnItemChange.bind(this));
        Hooks.on('deleteItem', this.renderOnItemChange.bind(this));
    }

    renderOnItemChange(itemDoc) {
        const sourceKey = itemDoc.id
        const hasItem = this.document.items.some((item) => item.data.data.metadata.sourceKey === sourceKey);
        if (hasItem) {
            this.render();
        }
    }

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


    /** @override */
    getData(options) {
        // because we don't want an infinite loop, we ensure we use only the super data, to fetch actor data and properties.
        const data = super.getData(options);
        // data.prime = new Prime({actor:this.actor}, this, data);

        data.characterNameClass = this.getCharacterNameClass(this.name);
        data.isFromTokenClass = "";
        if (this.actor.isToken) {
            data.isFromTokenClass = "isCloneActor";
        }

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


    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;


        html.find(".toggleCharacterEditing").click(this.toggleSheetEditMode.bind(this));
        html.find(".toggleCharacterLocked").click(this.toggleSheetEditMode.bind(this));

        html.find(".primeWrapper, .refinementWrapper").dblclick(this.toggleValueEditMode.bind(this));
        html.find(".primeWrapper, .refinementWrapper").click(this.checkPreventClose.bind(this));

        html.click(this.clearValueEditMode.bind(this));

        const resizeHandle = html.parent().parent().find(".window-resizable-handle");

        resizeHandle.mousedown(this.resizeUpdateStart.bind(this));
        $(document).mouseup(this.resizeUpdateEnd.bind(this));
        resizeHandle.click(this.resizeUpdateEnd.bind(this));


        const perkWrapper = html.find(".perksOuterWrapper");
        ItemCardUI.bindEvents(perkWrapper);
        ItemDragSort.bindEvents(perkWrapper, ".itemCard", true, false, true, this.updateSortOrder.bind(this), "perk");

        const actionWrapper = html.find(".actionsHolder");
        ItemCardUI.bindEvents(actionWrapper);

        const inventoryWrapper = html.find(".generalItems");
        if (inventoryWrapper.length > 0) {
            ItemDragSort.bindEvents(inventoryWrapper, ".inventoryItem", false, true, false, this.updateSortOrder.bind(this), "inventory");
        }
    }

    updateSortOrder(itemIndex, insertAfterIndex, itemType) {
        if(itemIndex === insertAfterIndex){
            return; // why bother?
        }
        let itemsToSort;
        switch (itemType) {
            case "inventory":
                itemsToSort = this.document.inventory.ordered.items;
                break;
            case "perk":
                itemsToSort = this.document.perks.ordered;
                break;
            default:
                const criteria = {
                    itemCollection:this.document.items,
                    matchAll: false,
                    typed: true,
                    itemBaseTypes: [itemType]
                };
                const processedItems = PrimeItemManager.getItems(criteria);
                let currentItemSortList = this.object.data.data[itemType + "Order"] || {};
                const sort = (itemA, itemB) => orderedSort(itemA, itemB, currentItemSortList);
                itemsToSort = processedItems[itemType];
                if (itemsToSort == null) {
                    console.error("ERROR: Unable to find items of type '" + itemType + "' in updateSortOrder(). processedItems: ", processedItems);
                }
                itemsToSort = (itemsToSort).sort(sort);
        }

        const moveHigher = insertAfterIndex > itemIndex; // are we moving higher (i.e. a greater index).

        const movedItem = itemsToSort[itemIndex];
        const start = itemsToSort.slice(0, moveHigher ? itemIndex : insertAfterIndex);
        const end = itemsToSort.slice(moveHigher ? insertAfterIndex : itemIndex+1);
        let all;
        if(moveHigher){
            const middle = itemsToSort.slice(itemIndex+1, insertAfterIndex);
            all = [...start, ...middle, movedItem, ...end]; // quick concatenation
        } else {
            const middle = itemsToSort.slice(insertAfterIndex, itemIndex);
            all = [...start, movedItem, ...middle, ...end]; // quick concatenation
        }
        const allMapped = all.map((item, index) => [item.id, index]);
        const itemOrder = Object.fromEntries(allMapped);

        switch (itemType) {
            case "inventory":
                this.document.inventory.ordered.inventoryOrder = itemOrder;
                return this.document.dyn.dataManager.commit({render: true});
                break;
            case "perk":
                this.document.perks.perkOrder = itemOrder;
                return this.document.dyn.dataManager.commit({render: true});
                break;
            default:
                let updateData = {};
                updateData.data = {}
                updateData.data[itemType + "Order"] = itemOrder;
                return this.object.update(updateData)
        }
    }
}