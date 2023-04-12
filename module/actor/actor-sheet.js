import { PrimeTables } from "../prime_tables.js";
import { ItemCardUI } from "../item/item_card_ui.js";
import { ItemDragSort } from "../item/item_drag_sort.js";


export class PrimePCActorSheet extends ActorSheet
{
	resizeOccuring = false;
	actorSheetMeasureTimer = false;
	updateWidthClassInterval = 50;

	hooksAdded = false;

	//bulkUpdatingOwnedItems = false;

	currentItemSortList = null;

	async _render(force=false, options={})
	{
		//if (!this.bulkUpdatingOwnedItems)
		//{
			return await super._render(force, options);
		//}
	}

	/** @override */
	static get defaultOptions()
	{
		var superOptions = super.defaultOptions;

		if (!this.hooksAdded)
		{
			this.addHooks();
			this.hooksAdded = true;
		}

		if (game.user.isGM)
		{
			var isGMClass = "userIsGM";
		}
		else
		{
			var isGMClass = "userIsNotGm";
		}

		var actorConfig =
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

	static addHooks()
	{
		Hooks.on("preUpdateActor", function(actorData, changeData, options, maybeUpdateID)
		{
			if (changeData.system && changeData.system.actionPoints && changeData.system.actionPoints.lastTotal && !changeData.system.actionPoints.value && changeData.system.actionPoints.value !== 0)
			{
				return false;
			}
			if (changeData.actionPoints && Array.isArray(changeData.actionPoints) && !changeData.system && !changeData.name && !changeData.img && (changeData.token && !changeData.token.img))
			{
				return false;
			}

			return true;
		});
	}

	deepCloneData(whatData)
	{
		return JSON.parse(JSON.stringify(whatData));
	}

	/** @override */
	async getData()
	{
		const sheetData = super.getData();
		//sheetData.dtypes = ["String", "Number", "Boolean"];

		sheetData.characterNameClass = this.getCharacterNameClass(sheetData.actor.name);
		sheetData.isFromTokenClass = "";
		if (this.actor.isToken)
		{
			sheetData.isFromTokenClass = "isCloneActor";
		}

		sheetData.currentOwners = this.actor.getCurrentOwners();
		sheetData.combinedResilience = this.actor.getCombinedResilience();
		sheetData.combinedPsyche = this.actor.getCombinedPsyche();

		sheetData.typeSorted = this.actor.getTypeSortedPrimesAndRefinements();

		sheetData.itemTables = PrimeTables.cloneAndTranslateTables("items");
		sheetData.actorTables = PrimeTables.cloneAndTranslateTables("actor");

		sheetData.filteredItems = this.actor.getProcessedItems();

		sheetData.inventoryItems = this.getInventoryItems(sheetData.filteredItems);
		sheetData.isV2CharacterClass = (sheetData.actor.system.sheetVersion == "v2.0") ? "characterSheetV2" : "characterSheetV1";

		sheetData.sheetVersion = sheetData.actor.system.sheetVersion;

		if (sheetData.filteredItems["perk"])
		{
			this.currentItemSortList = this.object.system.perkOrder || {};
			sheetData.perks = sheetData.filteredItems["perk"].sort(this.sortByItemOrder.bind(this));
		}
		else
		{
			sheetData.perks = [];
		}

		sheetData.sortedActions = this.object.getSortedActions();

		// HTML text
		sheetData.actorNotesHTML = await TextEditor.enrichHTML(sheetData.actor.system.notes, {
			async: true,
			relativeTo: this.actor
		});
		sheetData.actorBiographyHTML = await TextEditor.enrichHTML(sheetData.actor.system.metadata.biography, {
			async: true,
			relativeTo: this.actor
		});

		const source = this.actor.toObject();
		sheetData.actor = this.actor;
		sheetData.source = source.system;
		sheetData.system = this.actor.system;

		return sheetData;
	}

	getCharacterNameClass(whatName)
	{
		const canvas = document.createElement('canvas');
		const canvasContext = canvas.getContext('2d');
		canvasContext.font = "34px Signika";

		const nameText = canvasContext.measureText(whatName); 
		const nameWidth = nameText.width;

		// 215 is width of name field on default open.
		if (nameWidth <= 180)
		{
			return "largestNameFont";
		}
		else if (nameWidth > 180 && nameWidth <= 205)
		{
			return "largeNameFont";
		}
		else if (nameWidth > 205 && nameWidth <= 320)
		{
			return "mediumNameFont";
		}
		else if (nameWidth > 320 && nameWidth <= 450)
		{
			return "smallNameFont";
		}
		else
		{
			return "tinyNameFont";
		}
	}

	getInventoryItems(filteredItems)
	{
		var combinedItems = [];

		if (filteredItems["melee-weapon"])
		{
			combinedItems = combinedItems.concat(filteredItems["melee-weapon"]);
		}
		if (filteredItems["ranged-weapon"])
		{
			combinedItems = combinedItems.concat(filteredItems["ranged-weapon"]);
		}
		if (filteredItems["armour"])
		{
			combinedItems = combinedItems.concat(filteredItems["armour"]);
		}
		if (filteredItems["shield"])
		{
			combinedItems = combinedItems.concat(filteredItems["shield"]);
		}
		if (filteredItems["item"])
		{
			combinedItems = combinedItems.concat(filteredItems["item"]);
		}

		this.currentItemSortList = this.object.system.inventoryOrder || {};
		combinedItems = combinedItems.sort(this.sortByItemOrder.bind(this));

		return combinedItems;
	}

	sortByItemOrder(itemA, itemB)
	{
		var itemAPosition = this.currentItemSortList[itemA._id];
		var itemBPosition = this.currentItemSortList[itemB._id];

		if ((!itemAPosition && itemAPosition !== 0) || itemAPosition == -1)	// Sorting data is missing or not generated yet - leave with initial order
		{
			return 0;
		}

		if (itemAPosition < itemBPosition)
		{
			return -1;
		}
		if (itemAPosition > itemBPosition)
		{
			return 1;
		}

		return 0;
	}

	burnSoulPoint()
	{
		alert("Go'on, you know you want too...\n\n   (coming soon)");
	}

	statChanged(event)
	{
		const statDOMObject = $(event.delegateTarget);
		const isItemStat = statDOMObject.data("itemstat");
		if (isItemStat)
		{
			const statKey = statDOMObject.data("itemid");

			const statItem = this.object.items.get(statKey);

			statItem.system.value = statDOMObject.val();
			this.actor.updateEmbeddedDocuments("Item", [{...statItem, _id: statItem.id}]);
		}
	}

	toggleSheetEditMode()
	{
		this.element.toggleClass("sheetEditable");
	}

	toggleValueEditMode(event)
	{
		const outerWrapper = $(event.delegateTarget);
		const valueWrapper = outerWrapper.find(".valueWrapper");
		if (!valueWrapper.hasClass("valueEditable"))
		{
			var input = valueWrapper.find("input");
			input.focus();
			input.select();
			input.data("lastValue", input.val());
		}
		outerWrapper.toggleClass("valueEditable");
		valueWrapper.toggleClass("valueEditable");
		//this.element.toggleClass("sheetEditable");
	}

	checkPreventClose(event)
	{
		var valueWrapper = $(event.delegateTarget);
		if (valueWrapper.hasClass("valueEditable"))
		{
			event.stopPropagation();
		}
	}

	validateNumber(event)
	{
		var input = $(event.delegateTarget);
		var value = input.val();
		var parsed = parseInt(value);
		if (!isNaN(parsed))
		{
			var min = parseInt(input.data("min"));
			var max = parseInt(input.data("max"));
			if ((min || min === 0) && parsed < min)
			{
				parsed = min;
			}
			if ((max || max === 0) && parsed > max)
			{
				parsed = max;
			}
			if (parsed != value)
			{
				input.val(parsed);
			}
		}
		else if (input.data("lastValue"))
		{
			input.val(input.data("lastValue"));
		}
		else
		{
			input.val(input.data("min"));
		}
	}

	async updateActionPoints(event)
	{
		const input = $(event.delegateTarget);
		const value = input.val();
		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));
		const checked = input.prop("checked");
		const inputParent = input.parent();
		actorClone.system.actionPoints.lastTotal = actorClone.system.actionPoints.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			actorClone.system.actionPoints.value = parseInt(value);
		}
		else
		{
			actorClone.system.actionPoints.value = parseInt(value) - 1;
		}

		if (actorClone.system.actionPoints.value < 0)
		{
			actorClone.system.actionPoints.value = 0;
		}

		await this.actor.update(actorClone);
	}

	async updateInjuryTotal(event)
	{
		const input = $(event.delegateTarget);
		const value = input.val();
		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));
		const checked = input.prop("checked");
		const inputParent = input.parent();
		actorClone.system.health.wounds.lastTotal = actorClone.system.health.wounds.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			actorClone.system.health.wounds.value = parseInt(value);
		}
		else
		{
			actorClone.system.health.wounds.value = parseInt(value) - 1;
		}

		if (actorClone.system.health.wounds.value < 0)
		{
			actorClone.system.health.wounds.value = 0;
		}

		await this.actor.update(actorClone);
	}

	async updateInjuryDetail(event)
	{
		const select = $(event.delegateTarget);
		const value = select.val();
		const injuryIndex = select.data("injury-index");

		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));
		actorClone.system.wounds["wound" + (injuryIndex - 1)] = value;

		await this.actor.update(actorClone);
		this.render(true);
	}

	async healInjury(event)
	{
		const anchor = $(event.delegateTarget);
		const injuryIndex = anchor.data("injury-index");

		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));

		var count = injuryIndex - 1;
		while (count <= actorClone.system.health.wounds.max)
		{
			var _nextInjury = actorClone.system.wounds["wound" + (count + 1)]
			if (_nextInjury)
			{
				actorClone.system.wounds["wound" + count] = _nextInjury;
			}
			else
			{
				actorClone.system.wounds["wound" + count] = 0;
			}
			count++;
		}

		if (injuryIndex <= actorClone.system.health.wounds.value)
		{
			actorClone.system.health.wounds.lastTotal = actorClone.system.health.wounds.value;
			actorClone.system.health.wounds.value--;
		}

		await this.actor.update({...actorClone});
		this.render(true);
	}

	async updateInsanityTotal(event)
	{
		const input = $(event.delegateTarget);
		const value = input.val();
		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));
		const checked = input.prop("checked");
		const inputParent = input.parent();
		actorClone.system.mind.insanities.lastTotal = actorClone.system.mind.insanities.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			actorClone.system.mind.insanities.value = parseInt(value);
		}
		else
		{
			actorClone.system.mind.insanities.value = parseInt(value) - 1;
		}

		if (actorClone.system.mind.insanities.value < 0)
		{
			actorClone.system.mind.insanities.value = 0;
		}

		await this.actor.update(actorClone);
		this.render(true);
	}

	async updateInsanityDetail(event)
	{
		const select = $(event.delegateTarget);
		const value = select.val();
		const insanityIndex = select.data("insanity-index");

		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));
		actorClone.system.insanities["insanity" + (insanityIndex - 1)] = value;

		await this.actor.update(actorClone);
		this.render(true);
	}

	async healInsanity(event)
	{
		const anchor = $(event.delegateTarget);
		const insanityIndex = anchor.data("insanity-index");

		const sheetData = super.getData();
		const actorClone = JSON.parse(JSON.stringify(sheetData.actor));

		var count = insanityIndex - 1;
		while (count <= actorClone.system.mind.insanities.max)
		{
			var nextInsanity = actorClone.system.insanities["insanity" + (count + 1)]
			if (nextInsanity)
			{
				actorClone.system.insanities["insanity" + count] = nextInsanity;
			}
			else
			{
				actorClone.system.insanities["insanity" + count] = 0;
			}
			count++;
		}

		if (insanityIndex <= actorClone.system.mind.insanities.value)
		{
			actorClone.system.mind.insanities.lastTotal = actorClone.system.mind.insanities.value;
			actorClone.system.mind.insanities.value--;
		}

		await this.actor.update(actorClone);
		this.render(true);
	}

	resizeUpdateStart(event)
	{
		this.resizeOccuring = true;
		this.createWidthUpdateTimer();
	}

	createWidthUpdateTimer()
	{
		if (this.resizeOccuring)
		{
			this.actorSheetMeasureTimer = window.setTimeout(this.updateWidthClasses.bind(this), this.updateWidthClassInterval);
		}
		else
		{
			this.clearMeasureTimer();
		}
	}

	updateWidthClasses()
	{
		if (this.position.width <= 665)
		{
			this.element.addClass("narrowWidth");
			this.element.removeClass("mediumWidth");
			this.element.removeClass("wideWidth");
		}
		else if (this.position.width > 665 && this.position.width <= 995)
		{
			this.element.removeClass("narrowWidth");
			this.element.addClass("mediumWidth");
			this.element.removeClass("wideWidth");
		}
		else
		{
			this.element.removeClass("narrowWidth");
			this.element.removeClass("mediumWidth");
			this.element.addClass("wideWidth");
		}
		this.createWidthUpdateTimer();
	}

	resizeUpdateEnd(event)
	{
		this.resizeOccuring = false;
		this.updateWidthClasses()
	}

	clearMeasureTimer()
	{
		if (this.actorSheetMeasureTimer)
		{
			window.clearInterval(this.actorSheetMeasureTimer);
			this.actorSheetMeasureTimer = false;
		}
	}

	clearValueEditMode(event)
	{
		var valueWrappers = $(".valueEditable");
		valueWrappers.toggleClass("valueEditable");
	}


	deleteItem(event)
	{
		const deleteLink = $(event.delegateTarget);
		const itemID = deleteLink.data("item-id");
		this.actor.deleteOwnedItem(itemID);
	}

	openStatItem(event)
	{
		const statItemLink = $(event.delegateTarget);

		let item = null;
		const sourceKey = statItemLink.data("sourcekey");
		item = ItemDirectory.collection.get(sourceKey);

		if (item.system.customisable)
		{
			const itemID = statItemLink.data("item-id");
			item = this.object.items.get(itemID);
		}

		if (item)
		{
			const itemSheet = item.sheet;

			if (itemSheet.rendered)
			{
				itemSheet.maximize();
				itemSheet.bringToTop();
			}
			else
			{
				itemSheet.render(true);
			}
		}
		else
		{
			console.log()
		}
	}

	showOwnedItem(event)
	{
		event.preventDefault();
		const titleLink = $(event.delegateTarget);
		const itemID = titleLink.data("item-id");

		var item = this.object.items.get(itemID);
		if (!item)
		{
			item = ItemDirectory.collection.get(itemID);
		}

		const itemSheet = item.sheet;

		if (itemSheet.rendered)
		{
			itemSheet.maximize();
			itemSheet.bringToTop();
		}
		else
		{
			itemSheet.render(true);
		}
	}

	attackWithWeapon(event)
	{
		const titleLink = $(event.delegateTarget);
		const weaponID = titleLink.data("weapon-id");
		const weapon = this.object.items.get(weaponID);
		alert("Attack with: " + weapon.name)
	}

	async updateWornArmour(event)
	{
		const titleLink = $(event.delegateTarget);
		const armourID = titleLink.data("armour-id");
		const armour = this.object.items.get(armourID);

		var isWorn = armour.system.isWorn;
		if (isWorn)
		{
			armour.system.isWorn = false;
		}
		else
		{
			armour.system.isWorn = true;
		}

		//await armour.update(armour.data);
		this.entity.updateOwnedItem(armour.data);

		//this.entity.updateWornItemValues();
	}

	/** @override */
	activateListeners(html)
	{
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find(".statInput").change(this.statChanged.bind(this));

		html.find(".toggleCharacterEditing").click(this.toggleSheetEditMode.bind(this));
		html.find(".toggleCharacterLocked").click(this.toggleSheetEditMode.bind(this));

		html.find(".soulAndXP").click(this.burnSoulPoint.bind(this));

		html.find(".primeWrapper, .refinementWrapper").dblclick(this.toggleValueEditMode.bind(this));
		html.find(".primeWrapper, .refinementWrapper").click(this.checkPreventClose.bind(this));
		html.find(".showStatInfoIcon").click(this.openStatItem.bind(this));

		html.find("input[data-dtype='Number']").change(this.validateNumber.bind(this));

		html.click(this.clearValueEditMode.bind(this));

		html.find(".actionPointCheckbox").change(this.updateActionPoints.bind(this));

		//html.find(".injuryRow").click(this.checkEnableInjury.bind(this));

		html.find(".injuryCheckbox").change(this.updateInjuryTotal.bind(this));
		html.find(".injurySelect").change(this.updateInjuryDetail.bind(this));
		html.find(".healInjury").click(this.healInjury.bind(this));

		html.find(".insanityCheckbox").change(this.updateInsanityTotal.bind(this));
		html.find(".insanitySelect").change(this.updateInsanityDetail.bind(this));
		html.find(".healInsanity").click(this.healInsanity.bind(this));

		var resizeHandle = html.parent().parent().find(".window-resizable-handle");

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
		if (inventoryWrapper.length > 0)
		{
			ItemDragSort.bindEvents(inventoryWrapper, ".inventoryItem", false, true, false, this.updateSortOrder.bind(this), "inventory");
		}

		this.postActivateListeners(html);
	}

	updateSortOrder(itemIndex, insertAfterIndex, itemType)
	{
		//console.log("I would insert item '" + itemIndex + "' after item '" + insertAfterIndex + "'");
		//a = b;
		var processedItems = this.entity.getProcessedItems();

		if (itemType == "inventory")
		{
			var itemsToSort = this.getInventoryItems(processedItems);
		}
		else
		{
			var itemsToSort = processedItems[itemType];
		}
		var itemOrder = {};
		
		if (itemsToSort)
		{
			// If we're going to be shrinking the array before the
			// insertion point, we need to increase the insert index
			// to compensate.
			if (insertAfterIndex >= itemIndex)
			{
				insertAfterIndex--;
			}

			this.currentItemSortList = this.object.system[itemType + "Order"] || {};

			// Should match initial page order after this sort
			itemsToSort.sort(this.sortByItemOrder.bind(this));
			let itemToReInsert = itemsToSort.splice(itemIndex, 1)[0];
			itemsToSort.splice(insertAfterIndex, 0, itemToReInsert);

			//this.bulkUpdatingOwnedItems = true;
			var count = 0;
			while (count < itemsToSort.length)
			{
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
		}
		else
		{
			console.error("ERROR: Unable to find items of type '" + itemType + "' in updateSortOrder(). processedItems: ", processedItems);
		}
	}

	async postActivateListeners(html)
	{
		const sheetData = super.getData();

		html.find(".injurySelect").each(function(index, element)
		{
			$(element).val(sheetData.actor.system.wounds["wound" + index]);
		});

		html.find(".insanitySelect").each(function(index, element)
		{
			$(element).val(sheetData.actor.system.insanities["insanity" + index]);
		});

		html.find(".fillAnimation").removeClass("fillAnimation");
		html.find(".emptyAnimation").removeClass("emptyAnimation");

		if (sheetData.actor.system.actionPoints.lastTotal != sheetData.actor.system.actionPoints.value)
		{
			const actorClone = JSON.parse(JSON.stringify(sheetData.actor));
			actorClone.system.actionPoints.lastTotal = actorClone.system.actionPoints.value;
			await this.actor.update(actorClone, {render: false});
		}
	}
}