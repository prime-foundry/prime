import Component from "../../util/Component.js";

export default class Descriptions extends Component {

    constructor(parent) {
        super(parent);
    }

    get core(){
        return this.descriptions.core || '';
    }

    get core_path(){
        return this.descriptionsPath.with('core');
    }

    set core(coreDescription){
        this.write(this.core_path, coreDescription);
    }

    get setting(){
        return this.descriptions.setting || '';
    }

    get setting_path(){
        return this.descriptionsPath.with('setting');
    }

    set setting(settingDescription){
        this.write(this.setting_path, settingDescription);
    }

    get descriptions(){
        return this.gameSystem.descriptions || {};
    }

    get descriptionsPath(){
        return this.gameSystemPath.with('descriptions');
    }
}