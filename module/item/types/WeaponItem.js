import InventoryItem from "./InventoryItem.js";
import {getComponentLazily} from "../../util/support.js";
import Weapon from "../components/Weapon.js";

export default class WeaponItem extends InventoryItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get equippable() {
        return true;
    }


    get weapon() {
        return getComponentLazily(this, 'weapon', Weapon);
    }

    use() {
        alert(`Attack with: ${this.name}`);
    }
}