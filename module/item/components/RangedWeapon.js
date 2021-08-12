
import {getComponentLazily} from "../../util/support.js";
import Weapon from "./Weapon.js";
import Ranges from "./Ranges.js";
import Ammo from "./Ammo.js";


export default class RangedWeapon extends Weapon {
    constructor(parent) {
        super(parent);
    }

    get ranges() {
        return getComponentLazily(this, 'ranges', Ranges);
    }

    get ammo() {
        return getComponentLazily(this, 'ammo', Ammo);
    }
}