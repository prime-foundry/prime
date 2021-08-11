import InventoryItem from "./InventoryItem.js";

export default class ShieldItem extends InventoryItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get equippable() {
        return true;
    }
}