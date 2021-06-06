import ActorComponent from './util/ActorComponent.js';
import BaseValueMaxComponent from './util/BaseValueMaxComponent.js';
export default class Health extends ActorComponent {
    constructor(actor) {
        super(actor);
    }
    get wounds() {
        if(!this._wounds){
            this._wounds = new Wounds(this);
        }
        return this._wounds;
    }
    set wounds(value) {
        this.wounds.value = value;
    }
    get resilience() {
        if(!this._resilience){
            this._resilience = new Resilience(this);
        }
        return this._resilience;
    }
    set resilience(value) {
        this.resilience.value = value;
    }
    get insanities() {
        if(!this._insanities){
            this._insanities = new Insanities(this);
        }
        return this._insanities;
    }
    set insanities(value) {
        this.insanities.value = value;
    }
    get psyche() {
        if(!this._psyche){
            this._psyche = new Psyche(this);
        }
        return this._psyche;
    }
    set psyche(value) {
        this.psyche.value = value;
    }
}

class Wounds extends Injury {
    constructor(actor) {
        super(actor);
    }
    getStatBonuses(){
        return this.actor.getStatBonusesFromItems("mind.health.wounds");
    }
    getData() {
        return this.actorDataProperties.health.wounds;
    }
}
class Resilience extends BaseValueMaxComponent {
    constructor(actor) {
        super(actor);
    }
    getStatBonuses(){
        return this.actor.getStatBonusesFromItems("mind.health.resilience");
    }
    getData() {
        return this.actorDataProperties.health.resilience;
    }
}
class Insanities extends Injury {
    constructor(actor) {
        super(actor);
    }
    getStatBonuses(){
        return this.actor.getStatBonusesFromItems("mind.insanities.max");
    }
    getData() {
        return this.actorDataProperties.mind.insanities;
    }
}
class Psyche extends BaseValueMaxComponent {
    constructor(actor) {
        super(actor);
    }
    getStatBonuses(){
        return this.actor.getStatBonusesFromItems("mind.psyche.max");
    }
    getData() {
        return this.actorDataProperties.mind.psyche;
    }
}

/**
 * Injuries have 2 states
 * Tended,
 * Tended wounds are persistant and might come back.
 * Healed,
 * Healed wounds are gone.
 */
class Injury extends BaseValueMaxComponent {
    constructor(actor) {
        super(actor);
    }

    /**
     * If the injuries are tended, then the injuries count as not existing towards the total. However we need to accommodate it on the UI.
     * @return {*}
     */
    get slots() {
        return this.max + this.getInjuriesData().filter(injury => injury.tended).length;
    }
    get injuries(){
        return this.getInjuriesData().map(injury => {
            return {tended: injury.tended, detail: injury.detail}
        })
    }
    injure(detail = null){
        this.getInjuriesData().push({detail, tended:false});
        this.increment();
    }
    setInjuryDetail(index, detail){
        const injury = this.getInjuryData(index);
        if(injury){
            injury.detail = detail;
            this.update();
        }
    }
    heal(index) {
        const injury = this.getInjuryData(index);
        if(injury){
            // delete item at index.
            this.getInjuriesData().splice(index,1);
            if(injury.tended){
                this.update();
            } else {
                this.decrement();
            }
        }
    }
    tend(index) {
        const injury = this.getInjuryData(index);
        if(injury && !injury.tended) {
            injury.tended = true;
            this.decrement();
        }
    }
    untend(index) {
        const injury = this.getInjuryData(index);
        if(injury && injury.tended) {
            injury.tended = false;
            this.increment();
        }
    }

    getInjuryData(index){
        return this.getInjuriesData()[index];
    }

    getInjuriesData(){
        const data = this.getData();
        if(!data.injuries) {
            data.injuries = [];
        }
        return data.injuries;
    }
}
