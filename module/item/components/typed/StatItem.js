import Component from "../../../util/Component.js";

export default class StatItem extends Component {
    constructor(primeItem) {
        super(primeItem);
    }

    get default(){
        return this.system.default;
    }

    get customisable(){
        return this.system.customisable;
   }

    get statType(){
        return this.system.statType;
    }

    get setting(){
        return this.system.setting;
    }
    /**
     *
     * @param {boolean} bool
     */
    set default(bool){
        super.writeToSystem('default', !!bool)
    }

    /**
     *
     * @param {boolean} bool
     */
    set customisable(bool){
        super.writeToSystem('customisable', !!bool)
    }

    set statType(statType) {
        super.writeToSystem('statType', statType)
    }


    set setting(setting) {
        super.writeToSystem('setting', setting)
    }
}