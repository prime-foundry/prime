import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import WeaponItem from "../../item/types/WeaponItem.js";
import ArmourItem from "../../item/types/ArmourItem.js";
import InventoryItem from "../../item/types/InventoryItem.js";
import ShieldItem from "../../item/types/ShieldItem.js";
import RangedWeaponItem from "../../item/types/RangedWeaponItem.js";
import {getComponentLazily, orderedSort} from "../../util/support.js";
import {MaterialCosts} from "../../item/components/Costs.js";
import {getter} from "../../util/dyn_helpers.js";

const EQUIPPED_FILTER = item => item.equipped;
const CARRIED_FILTER = item => !item.equipped;
const NO_FILTER = item => true;


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
 * @extends RangedWeaponItem
 */
class EmbeddedRangedWeapon extends EmbeddedDocumentMixin(RangedWeaponItem) {
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

    constructor(parent) {
        super(parent);

        getter(this, 'cost', () => {
            const items = this.items;
            const total = {}
            for (const item of items) {
                item.aggregateCosts(total);
            }
            return total;
        }, {cached:true});

        getter(this, 'weight', () => {
            const items = this.items;
            let total = 0
            for (const item of items) {
                total += item.metrics.weight || 0;
            }
            return total;
        }, {cached:true});

        getter(this, 'quantity', () => {
            const items = this.items;
            let total = 0
            for (const item of items) {
                total += item.metrics.quantity || 1;
            }
            return total;
        }, {cached:true});

        getter(this, 'items', () => this.general.concat(this.weapons, this.shields, this.armour), {cached:true});
        getter(this, 'general', () => {
            const items = this.getItemDocsByBaseTypes("item");
            return items.map(item => new EmbeddedInventoryItem(this, item));
        }, {cached:true});
        getter(this, 'weapons', () => this.meleeWeapons.concat(this.rangedWeapons), {cached:true});
        getter(this, 'meleeWeapons', () => {
            const items = this.getItemDocsByBaseTypes("melee-weapon");
            return items.map(item => new EmbeddedWeapon(this, item));
        }, {cached:true});
        getter(this, 'rangedWeapons', () => {
            const items = this.getItemDocsByBaseTypes("ranged-weapon");
            return items.map(item => new EmbeddedRangedWeapon(this, item));
        }, {cached:true});
        getter(this, 'shields', () => {
            const items = this.getItemDocsByBaseTypes("shield");
            return items.map(item => new EmbeddedShield(this, item));
        }, {cached:true});
        getter(this, 'armour', () => {
            const items = this.getItemDocsByBaseTypes("armour");
            return items.map(item => new EmbeddedArmour(this, item));
        }, {cached:true});
        getter(this, 'equipped', () => new FilteredInventory(this, EQUIPPED_FILTER), {cached:true});
        getter(this, 'carried', () => new FilteredInventory(this, CARRIED_FILTER), {cached:true});
        getter(this, 'ordered', () => new OrderedInventory(this), {cached:true});
    }

    get wealth() {
        return getComponentLazily(this, 'wealth', MaterialCosts);
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
                return new EmbeddedWeapon(this, item);
            case "ranged-weapon":
                return new EmbeddedRangedWeapon(this, item);
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

    constructor(parent, filter) {
        super(parent);
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
        const sort = (itemA, itemB) => orderedSort(itemA, itemB, clonedInventoryOrder);
        return shallowClone.sort(sort);
    }

    get inventoryOrder() {
        return this.gameSystem.inventoryOrder || {};
    }

    set inventoryOrder(inventoryOrder) {
        this.write(this.gameSystemPath.with('inventoryOrder') , inventoryOrder);
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