import Component from "./Component.js";
import PrimeController from "../PrimeController.js";

export default class ParentComponent extends Component{

    constructor(document, controller) {
        super(undefined);
        this.__document = document;
        this.__controller = controller;
    }

    /**
     * @returns {PrimeController}
     * @protected
     */
    get _controller() {
        return this.__controller;
    }

    get _document() {
        return this.__document;
    }

    get _isRoot() {
        return true;
    }

}