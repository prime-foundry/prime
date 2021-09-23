import Component from "../../util/Component.js";

export default class Ammo extends Component {
    constructor(parent) {
        super(parent);
    }

    get ammo() {
        return this.gameSystem.ammo || {};
    }

    get ammoPath() {
        return this.gameSystemPath.with('ammo');
    }

    get type() {
        return this.ammo.type;
    }

    set type(type) {
        return this.write(this.ammoPath.with('type'), type);
    }

    get capacity() {
        return this.ammo.capacity || 0;
    }

    set capacity(capacity) {
        return this.write(this.ammoPath.with('capacity'), capacity);
    }
}