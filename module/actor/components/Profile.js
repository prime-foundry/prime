import Component from "../../util/Component.js";

export default class Profile extends Component {

    constructor(parent) {
        super(parent);
    }

    get metadata() {
        return this.system.metadata;
    }

    writeToProfile(value, ...pathComponents) {
        this.write(this.pathToProfile(...pathComponents), value);
    }

    pathToProfile(...pathComponents){
        return this.pathToGameSystemData('profile', ...pathComponents);
    }

    get name() {
        return this.content.name;
    }

    set name(name) {
        this.write(this.pathToFoundryData('name'), name)
    }

    get portrait() {
        return this.content.img;
    }

    //TODO relook at ownersNames
    get ownersNames() {
        const owners = this.document._owners;
        return owners.length === 0 ? "Not Assigned" : owners.map(owner => owner.name).join(", ");
    }

    /**
     * @return {boolean}
     */
    get npc() {
        return !!this.metadata.isNPC;
    }

    /**
     * @param {boolean} npc
     */
    set npc(npc) {
        this.writeToProfile(npc, 'isNPC');
    }

    get race() {
        return this.metadata.race;
    }

    set race(race) {
        this.writeToProfile(race, 'race');
    }

    get faction() {
        return this.metadata.faction;
    }

    set faction(faction) {;
        this.writeToProfile(faction, 'faction');
    }

    get occupation() {
        return this.metadata.occupation;
    }

    set occupation(occupation) {
        this.writeToProfile(occupation, 'occupation');
    }

    get celestial() {
        return this.metadata.celestial;
    }

    set celestial(celestial) {
        this.writeToProfile(celestial, 'celestial');
    }

    get birthplace() {
        return this.metadata.birthplace;
    }

    set birthplace(birthplace) {
        this.writeToProfile(birthplace, 'birthplace');
    }

    get rankOrTitle() {
        return this.metadata.rankOrTitle;
    }

    set rankOrTitle(rankOrTitle) {
        this.writeToProfile(rankOrTitle, 'rankOrTitle');
    }

    get height() {
        return this.metadata.height;
    }

    set height(height) {
        this.writeToProfile(height, 'height');
    }

    get weight() {
        return this.metadata.weight;
    }

    set weight(weight) {
        this.writeToProfile(weight, 'weight');
    }

    get hair() {
        return this.metadata.hair;
    }

    set hair(hair) {
        this.writeToProfile(hair, 'hair');
    }

    get eyes() {
        return this.metadata.eyes;
    }

    set eyes(eyes) {
        this.writeToProfile(eyes, 'eyes');
    }

    get gender() {
        return this.metadata.gender;
    }

    set gender(gender) {
        this.writeToProfile(gender, 'gender');
    }

    get age() {
        return this.metadata.age;
    }

    set age(age) {
        this.writeToProfile(age, 'age');
    }

    get biography() {
        return this.metadata.biography;
    }

    set biography(biography) {
        this.writeToProfile(biography, 'biography');
    }
}
