import Component from "../../util/Component.js";
import {minmax} from "../../util/support.js";

export default class Weapon extends Component {
    constructor(parent) {
        super(parent);
    }

    get weapon(){
        return this.gameSystem.weapon || {};
    }

    get weaponPath(){
        return this.gameSystemPath.with('weapon');
    }

    get type() {
        return this.weapon.type;
    }

    set type(type) {
        return this.write(this.weaponPath.with('type'), type);
    }

    get size() {
        return this.weapon.size;
    }

    set size(size) {
        return this.write(this.weaponPath.with('size'), size);
    }

    get damageRating() {
        return this.weapon.damageRating || 0;
    }

    set damageRating(damageRating) {
        return this.write(this.weaponPath.with('damageRating'), minmax(-5, damageRating, 5));
    }

    get requiredHands() {
        return this.weapon.requiredHands || 1;
    }

    set requiredHands(requiredHands) {
        return this.write(this.weaponPath.with('requiredHands'), minmax(1, requiredHands,2));
    }

    get keywords(){
        return this.weapon.keywords || [];
    }

    set keywords(keywords){
        return this.write(this.weaponPath.with('keywords'), keywords);
    }

    set toggleKeyword(keyword){
        const keywords = this.keywords;
        const index = keywords.indexOf(keyword);
        if(index < 0){
            keywords.push(keyword);
            keywords.sort();
        } else {
            keywords.splice(index,1);
        }
        this.keywords = Array.from(keywords);
    }

    get woundConditions(){
        return this.weapon.woundConditions || [];
    }

    set woundConditions(woundConditions){
        return this.write(this.weaponPath.with('woundConditions'), woundConditions);
    }

    set toggleWoundCondition(woundCondition){
        const woundConditions = this.woundConditions;
        const index = woundConditions.indexOf(woundCondition);
        if(index < 0){
            woundConditions.push(woundCondition);
            woundConditions.sort();
        } else {
            woundConditions.splice(index,1);
        }
        this.woundConditions = Array.from(woundConditions);
    }

    get actions(){
        return this.weapon.actions || [];
    }

    set actions(actions){
        return this.write(this.weaponPath.with('actions'), actions);
    }

    set toggleAction(action){
        const actions = this.actions;
        const index = actions.indexOf(action);
        if(index < 0){
            actions.push(action);
            actions.sort();
        } else {
            actions.splice(index,1);
        }
        this.actions = Array.from(actions);
    }
}