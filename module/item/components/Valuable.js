import Component from "../../util/Component.js";

export default class Valuable extends Component {

    constructor(parent) {
        super(parent);
    }

    get type(){
        return this.valuable.type;
    }

    get amount(){
        return this.valuable.amount || 0;
    }

    set type(type){
        this.write(this.valuablePath.with('type'), type);
    }

    set amount(amount){
        this.write(this.valuablePath.with('amount'), Number(amount) || 0);
    }

    get valuable(){
        return this.gameSystem.valuable || {};
    }

    get valuablePath(){
        return this.gameSystemPath.with('valuable');
    }
}