import Component from "../../util/Component.js";

export default class Profile extends Component {

    constructor(parent) {
        super(parent);
    }

    get profile() {
        return this.gameSystem.profile || {};
    }

    writeToProfile(value, parameterName) {
        this.write(this.profilePath.with(parameterName), value);
    }

    get profilePath() {
        return this.gameSystemPath.with('profile');
    }

    get name() {
        return this.foundryData.name;
    }

    set name(name) {
        this.write(this.foundryDataPath.with('name'), name)
    }

    get portrait() {
        return this.foundryData.img;
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
        return !!this.profile.npc;
    }

    /**
     * @param {boolean} npc
     */
    set npc(npc) {
        this.writeToProfile(npc, 'npc');
    }

    get race() {
        return this.profile.race;
    }

    set race(race) {
        this.writeToProfile(race, 'race');
    }

    get faction() {
        return this.profile.faction;
    }

    set faction(faction) {
        ;
        this.writeToProfile(faction, 'faction');
    }

    get occupation() {
        return this.profile.occupation;
    }

    set occupation(occupation) {
        this.writeToProfile(occupation, 'occupation');
    }

    get celestial() {
        return this.profile.celestial;
    }

    set celestial(celestial) {
        this.writeToProfile(celestial, 'celestial');
    }

    get birthplace() {
        return this.profile.birthplace;
    }

    set birthplace(birthplace) {
        this.writeToProfile(birthplace, 'birthplace');
    }

    get rankOrTitle() {
        return this.profile.rankOrTitle;
    }

    set rankOrTitle(rankOrTitle) {
        this.writeToProfile(rankOrTitle, 'rankOrTitle');
    }

    get height() {
        return this.profile.height;
    }

    set height(height) {
        this.writeToProfile(height, 'height');
    }

    get weight() {
        return this.profile.weight;
    }

    set weight(weight) {
        this.writeToProfile(weight, 'weight');
    }

    get hair() {
        return this.profile.hair;
    }

    set hair(hair) {
        this.writeToProfile(hair, 'hair');
    }

    get eyes() {
        return this.profile.eyes;
    }

    set eyes(eyes) {
        this.writeToProfile(eyes, 'eyes');
    }

    get gender() {
        return this.profile.gender;
    }

    set gender(gender) {
        this.writeToProfile(gender, 'gender');
    }

    get age() {
        return this.profile.age;
    }

    set age(age) {
        this.writeToProfile(age, 'age');
    }

    get biography() {
        return this.profile.biography;
    }

    get biography_path() {
        return this.profilePath.with('biography');
    }

    set biography(biography) {
        this.write(this.biography_path, biography);
    }
}
