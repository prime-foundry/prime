import InventoryItem from "./InventoryItem.js";

export default class WeaponItem extends InventoryItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get equippable() {
        return true;
    }
}