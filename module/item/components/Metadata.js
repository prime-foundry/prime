import Component from "../../util/Component.js";

export default class Metadata extends Component {

    constructor(parent) {
        super(parent);
    }

    get sourceKey(){
        return this.metadata.sourceKey;
    }

    get source() {
        const sourceKey = this.sourceKey;
        if(sourceKey != null){
            const original = ItemDirectory.collection.get(this.sourceKey);
            if(original != null){
                return original;
            }
        }
        return this.document;
    }

    get default(){
        return this.metadata.default;
    }

    get customisable(){
        return this.metadata.customisable;
    }

    get setting(){
        return this.metadata.setting;
    }

    /**
     *
     * @param {boolean} bool
     */
    set default(bool){
        this.write(this.metadataPath.with('default'), !!bool);
    }

    /**
     *
     * @param {boolean} bool
     */
    set customisable(bool){
        this.write(this.metadataPath.with('customisable'), !!bool);
    }

    set setting(setting) {
        this.write(this.metadataPath.with('setting'), setting);
    }

    get metadata(){
        return this.gameSystem.metadata || {};
    }

    get metadataPath(){
        return this.gameSystemPath.with('metadata');
    }
}