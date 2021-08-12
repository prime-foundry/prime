import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import PerkItem from "../../item/types/PerkItem.js";

class Perk extends EmbeddedDocumentMixin(PerkItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

export default class Perks extends Component {
    constructor(parent) {
        super(parent);
    }

    get all() {
        const searchCriteria = {itemCollection:this.document.items,itemBaseTypes:['perk'], sortItems:true};
        let items = PrimeItemManager.getItems(searchCriteria);
        const perks = items.map(item => new Perk(this, item));
        return perks;
    }

    get qualifying() {
        const perks = this.all;
        const qualifyingOnly = perks.filter(perk => perk.qualifies(this.document));
        return qualifyingOnly;
    }

    displayPerk({id}) {
        (new Perk(this, this.document.items.get(id))).displaySource();
    }

    deletePerk({id}){
        (new Perk(this, this.document.items.get(id))).deleteItem();
    }
}