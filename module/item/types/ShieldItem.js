import WeaponItem from "./WeaponItem.js";
import {getComponentLazily} from "../../util/support.js";
import Shield from "../components/Shield.js";

export default class ShieldItem extends WeaponItem {
    constructor(primeItem) {
        super(primeItem);
    }

    get shield() {
        return getComponentLazily(this, 'shield', Shield);
    }

}