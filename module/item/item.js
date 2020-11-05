import { PrimeTables } from "../prime_tables.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class PrimeItem extends Item
{
	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData()
	{
		super.prepareData();

		// Get the Item's data
		const itemData = this.data;
		const actorData = this.actor ? this.actor.data : {};
		const data = itemData.data;
	}

	getProcessedClone()
	{
		let itemClone = $.extend(true, {}, this.data);
		let tables = PrimeTables.cloneAndTranslateTables("items");
		this.processItem(itemClone, tables);

		return itemClone;
	}


	// THIS
	processItem(itemData, tables)
	{
		switch (itemData.type)
		{
			case "item":
			break;
			case "melee-weapon":
				itemData = this.processWeapon(itemData, "melee", tables);
			break;
			case "ranged-weapon":
				itemData = this.processWeapon(itemData, "ranged", tables);
			break;
			case "perk":
				break;
			case "armour":
				itemData = this.processArmour(itemData, tables);
			break;
			default:
				console.warn("Unknown item type of '" + itemData.type + "' found in processItem().");
			break;
		}
		return itemData;
	}

	// THIS
	processWeapon(weaponData, catergory, tables)
	{
		// Needs to come first as we switch the type to it's title value later.
		weaponData.data.attackIcon = this.getAttackIconHTML(catergory, weaponData.data.weaponType);

		weaponData.data.weaponSize = this.getTitleFromTableByKey(weaponData.data.weaponSize, tables.weapons.sizes);
		weaponData.data.weaponType = this.getTitleFromTableByKey(weaponData.data.weaponType, tables.weapons[catergory + "Types"]);

		weaponData.data.rarity = this.getTitleFromTableByKey(weaponData.data.rarity, tables.rarity);

		weaponData.data.woundConditions = this.getTitlesFromTableByCheckboxGroupArray(weaponData.data.woundConditions, tables.weapons.woundConditions);
		weaponData.data.keywords = this.getTitlesFromTableByCheckboxGroupArray(weaponData.data.keywords, tables.weapons.keywords);
		weaponData.data.customActions = this.getTitlesFromTableByCheckboxGroupArray(weaponData.data.customActions, tables.weapons[catergory + "WeaponActions"]);


		if (catergory == "ranged")
		{
			weaponData.data.ammo.type = this.getTitleFromTableByKey(weaponData.data.ammo.type, tables.weapons.ammoTypes);
		}

		return weaponData
	}

	// THIS
	processArmour(armourData, tables)
	{
		armourData.data.keywords = this.getTitlesFromTableByCheckboxGroupArray(armourData.data.keywords, tables.armour.keywords);
		armourData.data.untrainedPenalty = this.getTitlesFromTableByCheckboxGroupArray(armourData.data.untrainedPenalty, tables.armour.untrainedPenalities);

		return armourData;
	}
	// THIS
	getTitleFromTableByKey(key, table)
	{
		var count = 0;
		while (count < table.length)
		{
			let entry = table[count];
			if (entry.key == key)
			{
				return entry.title;
			}
			count++;
		}
		console.error("ERROR: Unable to find an entry with the key of '" + key + "' in: ", table);
		return "";
	}

	// THIS
	getTitlesFromTableByCheckboxGroupArray(checkboxGroupArray, table)
	{
		var titlesArray = [];

		if (checkboxGroupArray.length != table.length)
		{
			console.warn("WARNING: Mismatched lengths between checkbox group array and data table.", checkboxGroupArray, table);
		}

		var count = 0;
		while (count < checkboxGroupArray.length)
		{
			if (checkboxGroupArray[count])
			{
				let entry = table[count];
				titlesArray.push("<span title='" + entry.description + "' class='hasTooltip'>" + entry.title + "</span>");
			}
			count++;
		}

		if (titlesArray.length == 0)
		{
			titlesArray.push("None");
		}
		return titlesArray.join(", ");
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
