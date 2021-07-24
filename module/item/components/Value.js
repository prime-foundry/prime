import Component from "../../util/Component.js";

export default class Value extends Component {

    constructor(parent) {
        super(parent);
    }

    get type(){
        return this.value.type;
    }

    get amount(){
        return this.value.amount || 0;
    }

    set type(type){
        this.write(this.valuePath.with('type'), type);
    }

    set amount(amount){
        this.write(this.valuePath.with('amount'), Number(amount) || 0);
    }

    get value(){
        return this.gameSystem.value || {};
    }

    get valuePath(){
        return this.gameSystemPath.with('value');
    }
}