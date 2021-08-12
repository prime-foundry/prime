import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import WeaponItem from "../../item/types/WeaponItem.js";
import ArmourItem from "../../item/types/ArmourItem.js";
import InventoryItem from "../../item/types/InventoryItem.js";
import ShieldItem from "../../item/types/ShieldItem.js";

const EQUIPPED_FILTER = item => item.equipped;
const CARRIED_FILTER = item => !item.equipped;
const NO_FILTER = item => true;

const ORDER_SORT = (itemA, itemB, currentItemSortList) => {
    const itemAPosition = currentItemSortList[itemA.id];
    const itemBPosition = currentItemSortList[itemB.id];

    // Sorting data is missing or not generated yet - put unordered at the end of the list.
    if (itemAPosition == null) {
        return itemBPosition == null ? 0 : -1;
    }
    if (itemBPosition == null) {
        return 1;
    }

    if (itemAPosition < itemBPosition) {
        return -1;
    }
    if (itemAPosition > itemBPosition) {
        return 1;
    }

    return 0;
};

/**
 * @extends InventoryItem
 */
class EmbeddedInventoryItem extends EmbeddedDocumentMixin(InventoryItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

/**
 * @extends WeaponItem
 */
class EmbeddedWeapon extends EmbeddedDocumentMixin(WeaponItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

/**
 * @extends ShieldItem
 */
class EmbeddedShield extends EmbeddedDocumentMixin(ShieldItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

/**
 * @extends ArmourItem
 */
class EmbeddedArmour extends EmbeddedDocumentMixin(ArmourItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

export default class Inventory extends Component {

    /**
     * "item", "melee-weapon", "ranged-weapon", "shield", "armour"
     * @returns {InventoryItem[]}
     */
    get items() {
        return this.general.concat(this.weapons, this.shields, this.armour);
    }

    /**
     * "item"
     * @returns {InventoryItem[]}
     */
    get general() {
        const items = this.getItemDocsByBaseTypes("item");
        return items.map(item => new EmbeddedInventoryItem(this, item));
    }

    /**
     * "melee-weapon", "ranged-weapon"
     * @returns {WeaponItem[]}
     */
    get weapons() {
        return this.meleeWeapons.concat(this.rangedWeapons);
    }

    /**
     * "melee-weapon"
     * @returns {WeaponItem[]}
     */
    get meleeWeapons() {
        const items = this.getItemDocsByBaseTypes("melee-weapon");
        return items.map(item => new EmbeddedWeapon(this, item));
    }

    /**
     * "ranged-weapon"
     * @returns {WeaponItem[]}
     */
    get rangedWeapons() {
        const items = this.getItemDocsByBaseTypes("ranged-weapon");
        return items.map(item => new EmbeddedWeapon(this, item));
    }

    /**
     * "shield"
     * @returns {ShieldItem[]}
     */
    get shields() {
        const items = this.getItemDocsByBaseTypes("shield");
        return items.map(item => new EmbeddedShield(this, item));
    }

    /**
     * "armour"
     * @returns {ArmourItem[]}
     */
    get armour() {
        const items = this.getItemDocsByBaseTypes("armour");
        return items.map(item => new EmbeddedArmour(this, item));
    }

    get equipped() {
        return new FilteredInventory(this, EQUIPPED_FILTER);
    }

    get carried() {
        return new FilteredInventory(this, CARRIED_FILTER);
    }

    get ordered() {
        return new OrderedInventory(this);
    }

    deleteItem({id}) {
        const embedded = this.getEmbeddedItemById(id);
        embedded.deleteItem();
    }

    displayItem({id}) {
        const embedded = this.getEmbeddedItemById(id);
        embedded.display();
    }

    isItemEquipped({id}) {
        const embedded = this.getEmbeddedItemById(id);
        return embedded.equipped;
    }

    toggleItemEquipped({id}) {
        const embedded = this.getEmbeddedItemById(id);
        embedded.equipped = !embedded.equipped;
    }

    useItem({id}) {
        const item = this.getEmbeddedItemById(id);
        item.use();
    }

    /**
     * @param id
     * @private
     */
    getEmbeddedItemById(id) {
        const item = this.document.items.get(id);
        switch (item.type) {
            case "melee-weapon":
            case "ranged-weapon":
                return new EmbeddedWeapon(this, item);
            case "shield":
                return new EmbeddedShield(this, item);
            case "armour":
                return new EmbeddedArmour(this, item);
            case "item":
            default:
                return new EmbeddedInventoryItem(this, item);
        }
    }

    /**
     * @param itemBaseTypes
     * @returns {PrimeItem[]}
     * @private
     */
    getItemDocsByBaseTypes(...itemBaseTypes) {
        const criteria = {
            itemCollection: this.document.items,
            matchAll: false,
            sortItems: true,
            itemBaseTypes: Array.from(itemBaseTypes)
        };
        const items = PrimeItemManager.getItems(criteria);
        return items;
    }
}

class InventoryBase extends Component {
    filter;

    constructor(parent, filter) {
        super(parent);
        this.filter = filter || NO_FILTER;
    }

    get items() {
        return this.modifyResult(this.getInventory().items);
    }

    get general() {
        return this.modifyResult(this.getInventory().general);
    }

    get weapons() {
        return this.modifyResult(this.getInventory().weapons);
    }

    get meleeWeapons() {
        return this.modifyResult(this.getInventory().meleeWeapons);
    }

    get rangedWeapons() {
        return this.modifyResult(this.getInventory().rangedWeapons);
    }

    get shields() {
        return this.modifyResult(this.getInventory().shields);
    }

    get armour() {
        return this.modifyResult(this.getInventory().armour);
    }

    /**
     * @abstract
     * @protected
     * @template {InventoryItem} A
     * @param {A[]} items
     * @returns {A[]}
     */
    modifyResult(items) {
        return [];
    }

    /**
     * @protected
     * @returns {Inventory}
     */
    getInventory() {
        if (this.parent instanceof Inventory || this.parent instanceof InventoryBase) {
            return this.parent;
        } else {
            return new Inventory(this);
        }
    }
}

class OrderedInventory extends InventoryBase {

    constructor(parent) {
        super(parent);
    }

    /**
     * @abstract
     * @protected
     * @template {InventoryItem} A
     * @param {A[]} items
     * @returns {A[]}
     */
    modifyResult(items) {
        const shallowClone = Array.from(items);
        const {...clonedInventoryOrder} = this.inventoryOrder; // a shallow clone for a shallow object.
        const sort = (itemA, itemB) => ORDER_SORT(itemA, itemB, clonedInventoryOrder);
        return shallowClone.sort(sort);
    }

    get inventoryOrder() {
        return this.gameSystem.inventoryOrder || {};
    }
}

class FilteredInventory extends InventoryBase {
    filter;

    constructor(parent, filter) {
        super(parent);
        this.filter = filter || NO_FILTER;
    }

    /**
     * @abstract
     * @protected
     * @template {InventoryItem} A
     * @param {A[]} items
     * @returns {A[]}
     */
    modifyResult(items) {
        return items.filter(this.filter);
    }
}