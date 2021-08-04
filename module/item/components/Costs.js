import Component from "../../util/Component.js";
// Supports both as a singular cost and multiple cost
class BaseCost extends Component {

    getCosts() {
        return this.gameSystem.costs || [];
    }

    getCostForType(typeToGet){
        return this.getCosts().find(({type}) => type === typeToGet ) || {};
    }

    indexForType(typeToGet){

        const costs = this.getCosts();
        return costs.findIndex(({type}) => type === typeToGet);
    }

    removeType(type) {
        const idx = this.indexForType(type);
        const costs = this.getCosts().splice(idx, 1);
        this.write(this.getCostsPath(),  costs);
    }

    setCostForType(type, amount) {
        const idx = this.indexForType(type);
        if(idx === -1) {
            const costs = this.getCosts();
            this.write(this.getCostsPath().with(costs.length), {type, amount});
        } else {
            this.write(this.getCostsPath().with(idx).with('amount'),  amount);
        }
    }

    getCostsPath(){
        return this.gameSystemPath.with('costs');
    }

    aggregate(total = {}){
        return total;
    }
}

/**
 * Represents part of a cost.
 */
class PartCost extends BaseCost {
    _type;
    constructor(parent, type) {
        super(parent);
        this._type = type;
    }

    get amount(){
        return this.getCostForType(this._type).amount || 0;
    }

    set amount(amount){
        this.setCostForType(this._type, amount);
    }

    aggregate(total = {}){
        const type = this._type;
        const amount = this.amount;
        if(total[type] != null) {
            total[type] = amount
        } else {
            total[type] += amount
        }
        return total;
    }
}

/**
 * Represents a single cost, whose type can also change, but only one cost is allowed.
 * However this should live happily with other costs.
 */
export class Cost extends PartCost {
    constructor(parent, type) {
        super(parent, type);
    }

    get type(){
        return this._type;
    }

    set type(type){
        const idxNew = this.indexForType(this._type );
        if(idxNew >= 0) {
            const idx = this.indexForType(this._type);
            this.write(this.getCostsPath().with(idx).with('type'), type);
            this._type = type;
        } else {
            const amount = this.amount;
            this.removeType(this._type);
            this._type = type;
            // will append if missing.
            this.amount = amount;
        }
    }
}

/**
 * Represents a collection of costs, be it money, and/or soul and/or xp.
 */
export class Costs extends BaseCost {

    get costs(){
        return this.getCosts().map(([type,]) => new PartCost(this, type) );
    }

    aggregate(total = {}){
        for(const cost of this.costs){
            cost.aggregate(total);
        }
        return total;
    }
}