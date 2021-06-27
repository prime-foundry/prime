import ActorComponent from './util/ActorComponent.js';

export default class Profile extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    get _metadataRead() {
        return this._systemRead.metadata;
    }
    
    get _metadataWrite() {
        return this._systemWrite.metadata;
    }
    
    get name() {
        return this._actor.name;
    }

    set name(name) {
        this._write.name = name;
    }

    get portrait() {
        return this._actor.img;
    }

    get ownersNames() {
        const owners = this._actor._owners;
        return owners.length === 0 ? "Not Assigned" : owners.map(owner => owner.name).join(", ");
    }

    /**
     * @return {boolean}
     */
    get npc() {
        return !!this._metadataRead.isNPC;
    }

    /**
     * @param {boolean} npc
     */
    set npc(npc) {
        this._metadataWrite.isNPC = !!npc;
    }

    get race() {
        return this._metadataRead.race;
    }

    set race(race) {
        this._metadataWrite.race = race;
    }

    get faction() {
        return this._metadataRead.faction;
    }

    set faction(faction) {
        this._metadataWrite.faction = faction;
    }

    get occupation() {
        return this._metadataRead.occupation;
    }

    set occupation(occupation) {
        this._metadataWrite.occupation = occupation;
    }


    get celestial() {
        return this._metadataRead.celestial;
    }

    set celestial(celestial) {
        this._metadataWrite.celestial = celestial;
    }

    get birthplace() {
        return this._metadataRead.birthplace;
    }

    set birthplace(birthplace) {
        this._metadataWrite.birthplace = birthplace;
    }

    get rankOrTitle() {
        return this._metadataRead.rankOrTitle;
    }

    set rankOrTitle(rankOrTitle) {
        this._metadataWrite.rankOrTitle = rankOrTitle;
    }

    get height() {
        return this._metadataRead.height;
    }

    set height(height) {
        this._metadataWrite.height = height;
    }

    get weight() {
        return this._metadataRead.weight;
    }

    set weight(weight) {
        this._metadataWrite.weight = weight;
    }

    get hair() {
        return this._metadataRead.hair;
    }

    set hair(hair) {
        this._metadataWrite.hair = hair;
    }

    get eyes() {
        return this._metadataRead.eyes;
    }

    set eyes(eyes) {
        this._metadataWrite.eyes = eyes;
    }

    get gender() {
        return this._metadataRead.gender;
    }

    set gender(gender) {
        this._metadataWrite.gender = gender;
    }

    get age() {
        return this._metadataRead.age;
    }

    set age(age) {
        this._metadataWrite.age = age;
    }

    get biography() {
        return this._metadataRead.biography;
    }

    set biography(biography) {
        this._metadataWrite.biography = biography;
    }
}
