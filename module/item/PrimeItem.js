import { PrimeTables } from "../prime_tables.js";
import {DynDocumentMixin} from "../util/DynFoundryMixins.js";
import StatItem from "./types/StatItem.js";
import InjuryItem from "./types/InjuryItem.js";
import PerkItem from "./types/PerkItem.js";
import CostedItem from "./types/CostedItem.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class PrimeItem extends DynDocumentMixin(Item, 'item', 'type')
{

	/**
	 * These are the types returned on the model named item, instead of this Document.
	 * This allows us to have typed values. If a default is not provided, then it will return the document.
	 *
	 * @param registry
	 */
	registerDynTypes(registry) {
		registry
			.default(CostedItem)
			.register('prime', StatItem)
			.register('refinement', StatItem)
			.register('perk', PerkItem)
			.register('injury', InjuryItem);
	}


	// static get config()
	// {
	// 	var baseItemConfig = super.config;
	// 	baseItemConfig.embeddedEntities =
	// 	{
	// 		"ActiveEffect": "effects",
	// 		"PerkBonus": "bonuses",
	// 	}
	// 	return baseItemConfig;
	// }

	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData()
	{
		super.prepareData();


	}

	// get typed() {
	// 	switch(this.type){
	// 		case 'prime':
	// 		case 'refinement':
	// 			return new StatItem(this);
	// 		default:
	// 			return null;
	// 	}
	// }

	// convertToCollection(objectToConvert)
	// {
	// 	var collectionConstructionArray = [];

	// 	for (var key in objectToConvert)
	// 	{
	// 		let currElement = objectToConvert[key];

	// 		collectionConstructionArray.push([key, currElement]);
	// 	}
	// 	var collection = new Collection(collectionConstructionArray);
	// 	return collection;
	// }

	getProcessedClone()
	{
		let itemClone = $.extend(true, {}, this.data);
		this.processItem(itemClone);

		return itemClone;
	}


	// THIS
	processItem(itemData)
	{
		switch (itemData.type)
		{
			case "item":
			break;
			case "melee-weapon":
			case "shield":
				itemData = this.processWeapon(itemData, "melee");
			break;
			case "ranged-weapon":
				itemData = this.processWeapon(itemData, "ranged");
			break;
			case "perk":
			case "action":
			case "prime":
			case "refinement":
			break;
			case "armour":
				itemData = this.processArmour(itemData);
			break;
			default:
				console.warn("Unknown item type of '" + itemData.type + "' found in processItem().");
			break;
		}
		return itemData;
	}

	processWeapon(weaponData, catergory)
	{
		// Needs to come first as we switch the type to it's title value later.
		weaponData.data.attackIcon = this.getAttackIconHTML(catergory, weaponData.data.weaponType);

		weaponData.data.weaponSize = PrimeTables.getTitleFromTableByKey(weaponData.data.weaponSize, "items.weapons.sizes");
		weaponData.data.weaponType = PrimeTables.getTitleFromTableByKey(weaponData.data.weaponType, "items.weapons." + catergory + "Types");

		weaponData.data.rarity = PrimeTables.getTitleFromTableByKey(weaponData.data.rarity, "items.rarity");

		//weaponData.data.woundConditions = PrimeTables.getTitlesFromTableByCheckboxGroupArray(weaponData.data.woundConditions, "actor.woundConditions");
		//weaponData.data.keywords = PrimeTables.getTitlesFromTableByCheckboxGroupArray(weaponData.data.keywords, "items.weapons.keywords");
		//weaponData.data.customActions = PrimeTables.getTitlesFromTableByCheckboxGroupArray(weaponData.data.customActions, "items.weapons." + catergory + "WeaponActions");
		
		weaponData.data.woundConditions = this.getSelectItemTitlesFromEffectData("checkbox-wound-conditions", "actor.woundConditions");
		weaponData.data.keywords = this.getSelectItemTitlesFromEffectData("checkbox-keywords", "items.weapons.keywords");
		weaponData.data.customActions = this.getSelectItemTitlesFromEffectData("checkbox-actions", "items.weapons." + catergory + "WeaponActions");

		if (catergory == "ranged")
		{
			weaponData.data.ammo.type = PrimeTables.getTitleFromTableByKey(weaponData.data.ammo.type, "items.weapons.ammoTypes");
		}

		return weaponData
	}

	processArmour(armourData)
	{
		//armourData.data.keywords = PrimeTables.getTitlesFromTableByCheckboxGroupArray(armourData.data.keywords, "items.armour.keywords");
		//armourData.data.untrainedPenalty = PrimeTables.getTitlesFromTableByCheckboxGroupArray(armourData.data.untrainedPenalty, "items.armour.untrainedPenalities");
		
		armourData.data.keywords = this.getSelectItemTitlesFromEffectData("checkbox-keywords", "items.armour.keywords");
		armourData.data.untrainedPenalty = this.getSelectItemTitlesFromEffectData("checkbox-untrained", "items.armour.untrainedPenalities");

		return armourData;
	}

	// TODO: REFACTOR THIS
	getSelectItemTitlesFromEffectData(effectType, tableDataPath)
	{
		const effect = this.getEffectData(effectType);
		var titlesArray = [];

		if (effect)	// If no effect, none have been set.
		{
		
			switch (effectType)
			{
				case "checkbox-actions":
					var lookupTable = PrimeTables.getActionKeysAndTitles(false, ["weaponCombo"]);
				break;
				case "checkbox-keywords":
				case "checkbox-wound-conditions":
				case "checkbox-untrained":
					var lookupTable = PrimeTables.cloneAndTranslateTables(tableDataPath);
				break;
				default:
					console.error("ERROR: unknown effect type of '" + effectType + "' passed to getSelectItemTitlesFromEffectData(). Unable to find matching effect: ", this.effects);
				break;
			}

			var count = 0;

			while (count < lookupTable.length)
			{
				let currLookupItem = lookupTable[count];
				if (effect.data.flags[currLookupItem.key])
				{
					if (currLookupItem.description)
					{
						var titleText = "<span title='" + currLookupItem.description + "' class='hasTooltip'>" + currLookupItem.title + "</span>"
					}
					else
					{
						let description = "";
						if (currLookupItem.source.data.data.description)
						{
							description += currLookupItem.source.data.data.description;
						}
						if (currLookupItem.source.data.data.settingDescription)
						{
							description += currLookupItem.source.data.data.settingDescription;
						}
						var titleText = "<span title='" + description + "' class='hasTooltip'>" + currLookupItem.title + "</span>"
					}
					
					titlesArray.push(titleText)
				}
				count++;
			}
		}

		if (titlesArray.length == 0)
		{
			titlesArray.push("None");
		}
		return titlesArray.join(", ");
	}

	getEffectData(effectType)
	{
		var targetEffect = null
		this.effects.forEach((effect, key, effects) =>
		{
			if (effect.data.flags.effectType == effectType)
			{
				targetEffect = effect;
			}
		});

		return targetEffect;
	}

	getAttackIconHTML(primaryType, subType)
	{
		switch (primaryType)
		{
			case "melee":
				var attackIcon = this.getMeleeAttackIcon(subType);
			break;
			case "ranged":
				var attackIcon = this.getRangedAttackIcon(subType);
			break;
			default:
				console.warn("Unknown weapon type of '" + primaryType + "' found in getAttackIconHTML().");
				var attackIcon = '<i class="game-icon game-icon-fist icon-md"></i>';
			break;
		}
		return attackIcon;
	}

	getMeleeAttackIcon(weaponType)
	{
		switch (weaponType)
		{
			case "blunt":
				var attackIcon = '<i class="game-icon game-icon-flanged-mace icon-md"></i>';
			break;
			case "sword":
				var attackIcon = '<i class="game-icon game-icon-bloody-sword icon-md"></i>';
			break;
			case "dagger":
				var attackIcon = '<i class="game-icon game-icon-curvy-knife icon-md"></i>';
			break;
			case "axe":
				var attackIcon = '<i class="game-icon game-icon-sharp-axe icon-md"></i>';
			break;
			case "pole":
				var attackIcon = '<i class="game-icon game-icon-trident icon-md"></i>';
			break;
			default:
				console.warn("Unknown weapon type of '" + weaponType + "' found in getAttackIconHTML().");
				var attackIcon = '<i class="game-icon game-icon-fist icon-md"></i>';
			break;
		}
		return attackIcon;
	}

	getRangedAttackIcon(weaponType)
	{
		switch (weaponType)
		{
			case "bow":
				var attackIcon = '<i class="game-icon game-icon-pocket-bow icon-md"></i>';
			break;
			case "mechanical":
				var attackIcon = '<i class="game-icon game-icon-crossbow icon-md"></i>';
			break;
			case "thrown":
				var attackIcon = '<i class="game-icon game-icon-thrown-spear icon-md"></i>';
			break;
			case "blowpipe":
				var attackIcon = '<i class="game-icon game-icon-straight-pipe icon-md"></i>';
			break;
			default:
				console.warn("Unknown weapon type of '" + weaponType + "' found in getAttackIconHTML().");
				var attackIcon = '<i class="game-icon game-icon-fist icon-md"></i>';
			break;
		}
		return attackIcon;
	}
}
