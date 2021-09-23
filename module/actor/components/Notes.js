import Component from "../../util/Component.js";

export default class Notes extends Component {

    constructor(parent) {
        super(parent);
    }

    get core(){
        return (this.gameSystem.notes || {}).core || '';
    }

    get core_path(){
        return this.gameSystemPath.with('notes', 'core');
    }

    set core(coreText){
        this.write(this.core_path, coreText);
    }
}
