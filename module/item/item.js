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
	}

	getProcessedClone()
	{
		let itemClone = $.extend(true, {}, this);
		this.processItem(itemClone);

		itemClone.itemID = this.id;

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
		weaponData.system.attackIcon = this.getAttackIconHTML(catergory, weaponData.system.weaponType);

		weaponData.system.weaponSize = PrimeTables.getTitleFromTableByKey(weaponData.system.weaponSize, "items.weapons.sizes");
		weaponData.system.weaponType = PrimeTables.getTitleFromTableByKey(weaponData.system.weaponType, "items.weapons." + catergory + "Types");

		weaponData.system.rarity = PrimeTables.getTitleFromTableByKey(weaponData.system.rarity, "items.rarity");
		weaponData.system.woundConditions = this.getSelectItemTitlesFromEffectData("checkbox-wound-conditions", "actor.woundConditions");
		weaponData.system.keywords = this.getSelectItemTitlesFromEffectData("checkbox-keywords", "items.weapons.keywords");
		weaponData.system.customActions = this.getSelectItemTitlesFromEffectData("checkbox-actions", "items.weapons." + catergory + "WeaponActions");

		if (catergory == "ranged")
		{
			weaponData.system.ammo.type = PrimeTables.getTitleFromTableByKey(weaponData.system.ammo.type, "items.weapons.ammoTypes");
		}

		return weaponData;
	}

	processArmour(armourData)
	{
		armourData.system.keywords = this.getSelectItemTitlesFromEffectData("checkbox-keywords", "items.armour.keywords");
		armourData.system.untrainedPenalty = this.getSelectItemTitlesFromEffectData("checkbox-untrained", "items.armour.untrainedPenalities");

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
				if (effect.flags[currLookupItem.key])
				{
					if (currLookupItem.description)
					{
						var titleText = "<span title='" + currLookupItem.description + "' class='hasTooltip'>" + currLookupItem.title + "</span>";
					}
					else
					{
						let description = "";
						if (currLookupItem.source.system.description)
						{
							description += currLookupItem.source.system.description;
						}
						if (currLookupItem.source.system.settingDescription)
						{
							description += currLookupItem.source.system.settingDescription;
						}
						var titleText = "<span title='" + description + "' class='hasTooltip'>" + currLookupItem.title + "</span>";
					}

					titlesArray.push(titleText);
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
		var targetEffect = null;
		this.effects.forEach((effect, key, effects) =>
		{
			if (effect.flags.effectType == effectType)
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
