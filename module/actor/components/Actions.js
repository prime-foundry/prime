import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import ActionItem from "../../item/types/ActionItem.js";

class Action extends EmbeddedDocumentMixin(ActionItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

export default class Actions extends Component {
    constructor(parent) {
        super(parent);
    }

    get collection() {
        return this.defaultActions.concat(this.perkActions);
    }

    get defaultActions() {
        const actionCriteria = {
            matchAll: false,
            sortItems: true,
            typed: true,
            filtersData: {metadata: {default: true}},
            itemBaseTypes: ["action"]
        };
        const items = PrimeItemManager.getItems(actionCriteria);
        const actions = items.map(item => new Action(this, item.document));
        return actions;
    }

    get perkActions() {
        const qualifyingPerks = this.document.perks.qualifying;
        const itemsTyped = qualifyingPerks.flatMap(perk => perk.modifiers).flatMap(modifier => modifier.getActions()).filter(item => item != null);
        const actions = itemsTyped.map(item => new Action(this, item.document));
        return actions;
    }

    /**
     * Will return the action, or null if the character doesn't have that action.
     * @param id
     * @returns {Action}
     */
    getAction(id){
        return this.collection.find(action => action.id === id);
    }

    get categorized() {
        return this.categorizeActions(this.collection);
    }

    categorizeActions(actions) {
        return actions.reduce((aggregator, currentAction) => {
            const sourceItem = currentAction.source;
            const actionType = sourceItem.actionType;
            if (aggregator[actionType] == null) {
                aggregator[actionType] = [currentAction];
            } else {
                aggregator[actionType].push(currentAction);
            }
            return aggregator;
        }, {});
    }

    displayAction({id}) {
        (new Action(this, ItemDirectory.collection.get(id))).displaySource();
    }
}