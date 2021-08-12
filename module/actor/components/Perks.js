import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import PerkItem from "../../item/types/PerkItem.js";
import {orderedSort} from "../../util/support.js";

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

    get ordered() {
        const {...clonedInventoryOrder} = this.perkOrder;
        const sort = (itemA, itemB) => orderedSort(itemA, itemB, clonedInventoryOrder);
        return this.all.sort(sort);
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

    get perkOrder() {
        return this.gameSystem.perkOrder || {};
    }

    set perkOrder(perkOrder) {
        this.write(this.gameSystemPath.with('perkOrder') , perkOrder);
    }
}