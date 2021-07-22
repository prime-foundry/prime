import Component from "../../../util/Component.js";
import {getComponentLazily} from "../../../util/support.js";
import Metadata from "../../../common/components/Metadata.js";
import Audit from "../Audit.js";
import Description from "../Description.js";

export default class CommonItem extends Component {
    constructor(primeItem) {
        super(primeItem);
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
    get description()  {
        return getComponentLazily(this, 'description', Description);
    }
}