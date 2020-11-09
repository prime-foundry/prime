import { PrimeTables } from "../prime_tables.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class PrimePCActorSheet extends ActorSheet
{
	resizeOccuring = false;
	actorSheetMeasureTimer = false;
	updateWidthClassInterval = 50;

	hooksAdded = false;

	/** @override */
	static get defaultOptions()
	{
		var superOptions = super.defaultOptions;

		if (!this.hooksAdded)
		{
			this.addHooks();
			this.hooksAdded = true;
		}

		return mergeObject(superOptions, {
			classes: ["primeSheet", "primeCharacterSheet", "sheet", "actor"],
			template: "systems/prime/templates/actor/actor-sheet.html",
			width: 775,
			height: 750,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "description"
				}
			],
		});
	}
	
	static addHooks()
	{
		Hooks.on("preUpdateActor", function(actorData, changeData, options, maybeUpdateID)
		{
			console.log("preUpdateActor()")
			if (changeData.data && changeData.data.actionPoints && changeData.data.actionPoints.lastTotal && !changeData.data.actionPoints.value && changeData.data.actionPoints.value !== 0)
			{
				return false;
			}
			if (changeData.actionPoints && Array.isArray(changeData.actionPoints) && !changeData.data && !changeData.name && !changeData.img && (changeData.token && !changeData.token.img))
			{
				return false;
			}
			return true;			
		});
	}


	/* -------------------------------------------- */

	/** @override */
	getData()
	{
		const data = super.getData();
		data.dtypes = ["String", "Number", "Boolean"];

		//var a = data.actor.permission
		data.currentOwners = this.entity.getCurrentOwners();
		data.combinedResilience = this.entity.getCombinedResilience();
		data.typeSorted = this.entity.getTypeSortedPrimesAndRefinements();
		
		data.tables = PrimeTables.cloneAndTranslateTables("items");

		data.filteredItems = this.entity.getProcessedItems(data);

		return data;
	}

	toggleSheetEditMode()
	{
		this.element.toggleClass("sheetEditable");
	}

	toggleValueEditMode(event)
	{
		var valueWrapper = $(event.delegateTarget);
		if (!valueWrapper.hasClass("valueEditable"))
		{
			var input = valueWrapper.find("input");
			input.focus();
			input.select();
			input.data("lastValue", input.val());
		}
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
				console.log("Trimmed noise, initial: '" + value + "', parsed:'" + parsed + "'");
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
		const data = super.getData();
		const checked = input.prop("checked");
		const inputParent = input.parent();
		data.data.actionPoints.lastTotal = data.data.actionPoints.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			data.data.actionPoints.value = parseInt(value);
		}
		else
		{
			data.data.actionPoints.value = parseInt(value) - 1;
		}

		if (data.data.actionPoints.value < 0)
		{
			data.data.actionPoints.value = 0;
		}

		var result = await this.actor.update(data.actor);
		//console.log(result);
	}

	async updateInjuryTotal(event)
	{
		const input = $(event.delegateTarget);
		const value = input.val();
		const data = super.getData();
		const checked = input.prop("checked");
		const inputParent = input.parent();
		data.data.health.wounds.lastTotal = data.data.health.wounds.value;

		if (checked || (!checked && !inputParent.hasClass("currentPointTotal")))
		{
			data.data.health.wounds.value = parseInt(value);
		}
		else
		{
			data.data.health.wounds.value = parseInt(value) - 1;
		}

		if (data.data.health.wounds.value < 0)
		{
			data.data.health.wounds.value = 0;
		}

		var result = await this.actor.update(data.actor);
	}

	async updateInjuryDetail(event)
	{
		const select = $(event.delegateTarget);
		const value = select.val();
		const injuryIndex = select.data("injury-index");
				
		const data = super.getData();
		data.data.wounds["wound" + (injuryIndex - 1)] = value;

		var result = await this.actor.update(data.actor);
	}

	// checkEnableInjury(event)
	// {
	// 	const injuryRow = $(event.delegateTarget);
	// 	const siblingCheckbox = injuryRow.find(".injuryCheckbox");
	// 	const checkBoxState = siblingCheckbox.val();
	// 	if (siblingCheckbox.prop( "checked" ) == false)
	// 	{
	// 		siblingCheckbox.prop( "checked", true );
	// 	}
	// }

	async healInjury(event)
	{
		const anchor = $(event.delegateTarget);
		const injuryIndex = anchor.data("injury-index");
				
		const data = super.getData();

		var count = injuryIndex - 1;
		while (count <= data.data.health.wounds.max)
		{
			var _nextInjury = data.data.wounds["wound" + (count + 1)]
			if (_nextInjury)
			{
				data.data.wounds["wound" + count] = _nextInjury;
			}
			else
			{
				data.data.wounds["wound" + count] = 0;
			}
			count++;
		}

		if (injuryIndex <= data.data.health.wounds.value)
		{
			data.data.health.wounds.lastTotal = data.data.health.wounds.value;
			data.data.health.wounds.value--;
		}

		var result = await this.actor.update(data.actor);
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
		//console.log(this.position.width);
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
		//console.log("Ending...")
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

	showOwnedItem(event)
	{
		event.preventDefault();
		const titleLink = $(event.delegateTarget);
		const itemID = titleLink.data("item-id");

		const item = this.object.items.get(itemID);
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

		var isWorn = armour.data.data.isWorn;
		if (isWorn)
		{
			armour.data.data.isWorn = false;
		}
		else
		{
			armour.data.data.isWorn = true;
		}
		
		var result = await armour.update(armour.data);

		this.updateArmourValues();
	}

	async updateArmourValues()
	{
		var data = super.getData();
		var currentArmour = this.getMostResilientArmour(data.items);
		
		data.data.armour.protection.value = currentArmour.data.protection;
		data.data.armour.protection.max = currentArmour.data.protection;
		data.data.armour.resilience.value = currentArmour.data.armourResilience;
		data.data.armour.resilience.max = currentArmour.data.armourResilience;

		var result = await this.actor.update(data.actor);
	}

	getMostResilientArmour(items)
	{
		var bestArmour =
		{
			data: {armourResilience: 0, protection: 0}
		};
		var currItem = null;
		var count = 0;
		while (count < items.length)
		{
			currItem = items[count];
			if (currItem.type == "armour" && currItem.data.isWorn && currItem.data.armourResilience > bestArmour.data.armourResilience)
			{
				bestArmour = currItem;
			}
			count++;
		}
		return bestArmour;		
	}
	
	/** @override */
	activateListeners(html)
	{
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find(".toggleCharacterEditing").click(this.toggleSheetEditMode.bind(this));
		html.find(".toggleCharacterLocked").click(this.toggleSheetEditMode.bind(this));

		html.find(".valueWrapper").dblclick(this.toggleValueEditMode.bind(this));
		html.find(".valueWrapper").click(this.checkPreventClose.bind(this));
		
		html.find("input[data-dtype='Number']").change(this.validateNumber.bind(this));

		html.click(this.clearValueEditMode.bind(this));

		html.find(".actionPointCheckbox").change(this.updateActionPoints.bind(this));
		
		//html.find(".injuryRow").click(this.checkEnableInjury.bind(this));
		
		html.find(".injuryCheckbox").change(this.updateInjuryTotal.bind(this));
		html.find(".injurySelect").change(this.updateInjuryDetail.bind(this));
		html.find(".healInjury").click(this.healInjury.bind(this));

		var resizeHandle = html.parent().parent().find(".window-resizable-handle");
		
		resizeHandle.mousedown(this.resizeUpdateStart.bind(this));
		$(document).mouseup(this.resizeUpdateEnd.bind(this));
		resizeHandle.click(this.resizeUpdateEnd.bind(this));

		html.find(".deleteItemIcon").click(this.deleteItem.bind(this));
		html.find(".itemTitle").click(this.showOwnedItem.bind(this));

		html.find(".attackWithWeapon").click(this.attackWithWeapon.bind(this));
		html.find(".armourWornCheckbox").click(this.updateWornArmour.bind(this));

		this.postActivateListeners(html);
	}

	async postActivateListeners(html)
	{
		const data = super.getData();

		html.find(".injurySelect").each(function(index, element)
		{
			$(element).val(data.data.wounds["wound" + index]);
		});

		html.find(".fillAnimation").removeClass("fillAnimation");
		html.find(".emptyAnimation").removeClass("emptyAnimation");

		if (data.data.actionPoints.lastTotal != data.data.actionPoints.value)
		{
			data.data.actionPoints.lastTotal = data.data.actionPoints.value;
			var result = await this.actor.update(data.actor, {render: false});
		}
	}
}