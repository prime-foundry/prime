import ActorComponent from './util/ActorComponent.js';

export default class Profile extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    get _metadata() {
        return this._actorSystemData.metadata;
    }

    get name() {
        return this._actor.name;
    }

    set name(name) {
        this._actorData.name = name;
        this._update();
    }

    get portrait() {
        return this._actor.img;
    }

    get ownersNames() {
        const owners = this._owners;
        return owners.length === 0 ? "Not Assigned" : owners.map(owner => owner.name).join(", ");
    }

    /**
     * @return {boolean}
     */
    get npc() {
        return !!this._metadata.isNPC;
    }

    /**
     * @param {boolean} npc
     */
    set npc(npc) {
        this._metadata.isNPC = !!npc;
        this._update();
    }

    get race() {
        return this._metadata.race;
    }

    set race(race) {
        this._metadata.race = race;
        this._update();
    }

    get faction() {
        return this._metadata.faction;
    }

    set faction(faction) {
        this._metadata.faction = faction;
        this._update();
    }

    get occupation() {
        return this._metadata.occupation;
    }

    set occupation(occupation) {
        this._metadata.occupation = occupation;
        this._update();
    }


    get celestial() {
        return this._metadata.celestial;
    }

    set celestial(celestial) {
        this._metadata.celestial = celestial;
        this._update();
    }

    get birthplace() {
        return this._metadata.birthplace;
    }

    set birthplace(birthplace) {
        this._metadata.birthplace = birthplace;
        this._update();
    }

    get rankOrTitle() {
        return this._metadata.rankOrTitle;
    }

    set rankOrTitle(rankOrTitle) {
        this._metadata.rankOrTitle = rankOrTitle;
        this._update();
    }

    get height() {
        return this._metadata.height;
    }

    set height(height) {
        this._metadata.height = height;
        this._update();
    }

    get weight() {
        return this._metadata.weight;
    }

    set weight(weight) {
        this._metadata.weight = weight;
        this._update();
    }

    get hair() {
        return this._metadata.hair;
    }

    set hair(hair) {
        this._metadata.hair = hair;
        this._update();
    }

    get eyes() {
        return this._metadata.eyes;
    }

    set eyes(eyes) {
        this._metadata.eyes = eyes;
        this._update();
    }

    get gender() {
        return this._metadata.gender;
    }

    set gender(gender) {
        this._metadata.gender = gender;
        this._update();
    }

    get age() {
        return this._metadata.age;
    }

    set age(age) {
        this._metadata.age = age;
        this._update();
    }

    get biography() {
        return this._metadata.biography;
    }

    set biography(biography) {
        this._metadata.biography = biography;
        this._update();
    }
}
