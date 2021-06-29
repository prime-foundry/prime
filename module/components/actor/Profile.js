import ActorComponent from './util/ActorComponent.js';

export default class Profile extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    get metadata() {
        return this.readSystemData.metadata;
    }

    writeMetadata(propertyName, value) {
        this.writeSystemData(`metadata.${propertyName}`, value);
    }
    
    get name() {
        return this.readData.name;
    }

    set name(name) {
        this.writeData('name', name);
    }

    get portrait() {
        return this.actor.img;
    }

    get ownersNames() {
        const owners = this.actor._owners;
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
        this.writeMetadata('isNPC',!!npc);
    }

    get race() {
        return this.metadata.race;
    }

    set race(race) {
        this.writeMetadata('race',race);
    }

    get faction() {
        return this.metadata.faction;
    }

    set faction(faction) {;
        this.writeMetadata('faction',faction);
    }

    get occupation() {
        return this.metadata.occupation;
    }

    set occupation(occupation) {
        this.writeMetadata('occupation',occupation);
    }


    get celestial() {
        return this.metadata.celestial;
    }

    set celestial(celestial) {
        this.writeMetadata('celestial',celestial);
    }

    get birthplace() {
        return this.metadata.birthplace;
    }

    set birthplace(birthplace) {
        this.writeMetadata('birthplace',birthplace);
    }

    get rankOrTitle() {
        return this.metadata.rankOrTitle;
    }

    set rankOrTitle(rankOrTitle) {
        this.writeMetadata('rankOrTitle',rankOrTitle);
    }

    get height() {
        return this.metadata.height;
    }

    set height(height) {
        this.writeMetadata('height',height);
    }

    get weight() {
        return this.metadata.weight;
    }

    set weight(weight) {
        this.writeMetadata('weight',weight);
    }

    get hair() {
        return this.metadata.hair;
    }

    set hair(hair) {
        this.writeMetadata('hair',hair);
    }

    get eyes() {
        return this.metadata.eyes;
    }

    set eyes(eyes) {
        this.writeMetadata('eyes',eyes);
    }

    get gender() {
        return this.metadata.gender;
    }

    set gender(gender) {
        this.writeMetadata('gender',gender);
    }

    get age() {
        return this.metadata.age;
    }

    set age(age) {
        this.writeMetadata('age',age);
    }

    get biography() {
        return this.metadata.biography;
    }

    set biography(biography) {
        this.writeMetadata('biography',biography);
    }
}
