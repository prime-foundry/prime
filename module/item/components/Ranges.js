import Component from "../../util/Component.js";

export default class Ranges extends Component {
    constructor(parent) {
        super(parent);
    }

    get ranges() {
        return this.gameSystem.ranges || {};
    }

    get rangesPath() {
        return this.gameSystemPath.with('ranges');
    }

    get pointBlank() {
        return this.ranges.pointBlank.value || 0;
    }

    set pointBlank(pointBlank) {
        return this.write(this.rangesPath.with('pointBlank', 'value'), pointBlank);
    }

    get short() {
        return this.ranges.short.value || 0;
    }

    set short(short) {
        return this.write(this.rangesPath.with('short', 'value'), short);
    }

    get medium() {
        return this.ranges.medium.value || 0;
    }

    set medium(medium) {
        return this.write(this.rangesPath.with('medium', 'value'), medium);
    }

    get long() {
        return this.ranges.long.value || 0;
    }

    set long(long) {
        return this.write(this.rangesPath.with('long', 'value'), long);
    }

    get extreme() {
        return this.ranges.extreme.value || 0;
    }

    set extreme(extreme) {
        return this.write(this.rangesPath.with('extreme', 'value'), extreme);
    }
}