import {minmax} from "../../util/support.js";
import Weapon from "./Weapon.js";


export default class Shield extends Weapon {
    constructor(parent) {
        super(parent);
    }

    get shield() {
        return this.gameSystem.shield || {};
    }

    get shieldPath() {
        return this.gameSystemPath.with('shield');
    }

    get meleeBlockBonus() {
        return this.shield.meleeBlockBonus || 1;
    }

    set meleeBlockBonus(meleeBlockBonus) {
        return this.write(this.shieldPath.with('meleeBlockBonus'), minmax(-10, meleeBlockBonus, 10));
    }

    get rangedBlockBonus() {
        return this.shield.rangedBlockBonus || 1;
    }

    set rangedBlockBonus(rangedBlockBonus) {
        return this.write(this.shieldPath.with('rangedBlockBonus'), minmax(-10, rangedBlockBonus, 10));
    }
}