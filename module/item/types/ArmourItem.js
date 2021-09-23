import InventoryItem from "./InventoryItem.js";
import {getComponentLazily} from "../../util/support.js";
import Armour from "../components/Armour.js";

export default class ArmourItem extends InventoryItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get equippable() {
        return true;
    }

    get armour() {
        return getComponentLazily(this, 'armour', Armour);
    }
}