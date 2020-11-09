import { PrimeTables } from "../prime_tables.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class PrimeItem extends Item
{

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

		// if (!(this.data.data.bonuses instanceof Collection))
		// {
		// 	this.data.data.bonuses = this.convertToCollection(this.data.data.bonuses);
		// }

		// Get the Item's data
		const itemData = this.data;
		const actorData = this.actor ? this.actor.data : {};
		const data = itemData.data;
	}

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
				itemData = this.processWeapon(itemData, "melee");
			break;
			case "ranged-weapon":
				itemData = this.processWeapon(itemData, "ranged");
			break;
			case "perk":
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

		weaponData.data.woundConditions = PrimeTables.getTitlesFromTableByCheckboxGroupArray(weaponData.data.woundConditions, "items.weapons.woundConditions");
		weaponData.data.keywords = PrimeTables.getTitlesFromTableByCheckboxGroupArray(weaponData.data.keywords, "items.weapons.keywords");
		weaponData.data.customActions = PrimeTables.getTitlesFromTableByCheckboxGroupArray(weaponData.data.customActions, "items.weapons." + catergory + "WeaponActions");


		if (catergory == "ranged")
		{
			weaponData.data.ammo.type = PrimeTables.getTitleFromTableByKey(weaponData.data.ammo.type, "items.weapons.ammoTypes");
		}

		return weaponData
	}

	processArmour(armourData)
	{
		armourData.data.keywords = PrimeTables.getTitlesFromTableByCheckboxGroupArray(armourData.data.keywords, "items.armour.keywords");
		armourData.data.untrainedPenalty = PrimeTables.getTitlesFromTableByCheckboxGroupArray(armourData.data.untrainedPenalty, "items.armour.untrainedPenalities");

		return armourData;
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
