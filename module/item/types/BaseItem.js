import Component from "../../util/Component.js";
import {getComponentLazily} from "../../util/support.js";
import Metadata from "../components/Metadata.js";
import Audit from "../components/Audit.js";
import Descriptions from "../components/Descriptions.js";

export default class BaseItem extends Component {
    constructor(primeItem) {
        super(primeItem);
    }

    get id() {
        return this.document.id;
    }

    get name() {
        return this.foundryData.name;
    }

    set name(name) {
        this.write(this.foundryDataPath.with('name'), name);
    }

    get img() {
        return this.foundryData.img;
    }

    get sourceItem() {
        if(this.isOwnedItem){
            const sourceDoc = ItemDirectory.collection.get(this.metadata.sourceKey);
            if(sourceDoc != null){
                return sourceDoc.dyn.typed;
            }
        }
        return this;
    }

    get isOwnedItem(){
        return this.metadata && this.metadata.sourceKey && this.metadata.sourceKey !== this.id;
    }

    /**
     * @return {Audit}
     */
    get audit() {
        return getComponentLazily(this, 'audit', Audit);
    }

    get type() {
        return this.document.type;
    }

    /**
     * @return {Metadata}
     */
    get metadata() {
        return getComponentLazily(this, 'metadata', Metadata);
    }

    /**
     * @return {Description}
     */
    get descriptions()  {
        return getComponentLazily(this, 'descriptions', Descriptions);
    }

    get isOwned() {
        return this.document.isEmbedded;
    }

    get owningCharacterName() {
        if (this.isOwned) {
            return this.document.parent.name || '';
        }
        return '';
    }
}