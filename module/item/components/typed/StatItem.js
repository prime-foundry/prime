import Component from "../../../util/Component.js";
import {getComponentLazily} from "../../../util/support.js";
import Metadata from "../../../common/components/Metadata.js";

export default class StatItem extends Component {
    constructor(primeItem) {
        super(primeItem);
    }

    /**
     * @return {Metadata}
     */
    get metadata() {
        return getComponentLazily(this, 'metadata', Metadata);
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
        this.write(this.pathToGameSystemData('default'), !!bool);
    }

    /**
     *
     * @param {boolean} bool
     */
    set customisable(bool){
        this.write(this.pathToGameSystemData('customisable'), !!bool);
    }

    set statType(statType) {
        this.write(this.pathToGameSystemData('statType'), statType);
    }

    set setting(setting) {
        this.write(this.pathToGameSystemData('setting'), setting);
    }
}