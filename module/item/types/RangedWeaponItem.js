import {getComponentLazily} from "../../util/support.js";
import WeaponItem from "./WeaponItem.js";
import RangedWeapon from "../components/RangedWeapon.js";

export default class RangedWeaponItem extends WeaponItem  {
    constructor(primeItem) {
        super(primeItem);
    }

    get weapon() {
        return getComponentLazily(this, 'weapon', RangedWeapon);
    }

}