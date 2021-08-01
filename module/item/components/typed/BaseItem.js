import Component from "../../../util/Component.js";
import {getComponentLazily} from "../../../util/support.js";
import Metadata from "../Metadata.js";
import Audit from "../Audit.js";
import Descriptions from "../Descriptions.js";
import Valuable from "../Valuable.js";

export default class BaseItem extends Component {
    constructor(primeItem) {
        super(primeItem);
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

    /**
     * @return {Audit}
     */
    get audit() {
        return getComponentLazily(this, 'audit', Audit);
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


    /**
     * @return {Audit}
     */
	get value() {
        return getComponentLazily(this, 'value', Valuable);
    }

    /**
     * @return {string}
     */
    get type() {
        return this.foundryData.type;
    }
}