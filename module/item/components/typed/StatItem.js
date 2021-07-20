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
        return this.gameSystem.default;
    }

    get customisable(){
        return this.gameSystem.customisable;
   }

    get statType(){
        return this.gameSystem.statType;
    }

    get setting(){
        return this.gameSystem.setting;
    }

    /**
     *
     * @param {boolean} bool
     */
    set default(bool){
        this.write(this.gameSystemPath.with('default'), !!bool);
    }

    /**
     *
     * @param {boolean} bool
     */
    set customisable(bool){
        this.write(this.gameSystemPath.with('customisable'), !!bool);
    }

    set statType(statType) {
        this.write(this.gameSystemPath.with('statType'), statType);
    }

    set setting(setting) {
        this.write(this.gameSystemPath.with('setting'), setting);
    }
}