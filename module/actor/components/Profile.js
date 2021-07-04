import Component from "../../util/Component.js";

export default class Profile extends Component {

    constructor(parent) {
        super(parent);
    }

    get metadata() {
        return this.system.metadata;
    }

    writeToMetadata(propertyName, value) {
        this.writeToSystem(`metadata.${propertyName}`, value);
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
        this.writeToMetadata('isNPC', npc);
    }

    get race() {
        return this.metadata.race;
    }

    set race(race) {
        this.writeToMetadata('race',race);
    }

    get faction() {
        return this.metadata.faction;
    }

    set faction(faction) {;
        this.writeToMetadata('faction',faction);
    }

    get occupation() {
        return this.metadata.occupation;
    }

    set occupation(occupation) {
        this.writeToMetadata('occupation',occupation);
    }


    get celestial() {
        return this.metadata.celestial;
    }

    set celestial(celestial) {
        this.writeToMetadata('celestial',celestial);
    }

    get birthplace() {
        return this.metadata.birthplace;
    }

    set birthplace(birthplace) {
        this.writeToMetadata('birthplace',birthplace);
    }

    get rankOrTitle() {
        return this.metadata.rankOrTitle;
    }

    set rankOrTitle(rankOrTitle) {
        this.writeToMetadata('rankOrTitle',rankOrTitle);
    }

    get height() {
        return this.metadata.height;
    }

    set height(height) {
        this.writeToMetadata('height',height);
    }

    get weight() {
        return this.metadata.weight;
    }

    set weight(weight) {
        this.writeToMetadata('weight',weight);
    }

    get hair() {
        return this.metadata.hair;
    }

    set hair(hair) {
        this.writeToMetadata('hair',hair);
    }

    get eyes() {
        return this.metadata.eyes;
    }

    set eyes(eyes) {
        this.writeToMetadata('eyes',eyes);
    }

    get gender() {
        return this.metadata.gender;
    }

    set gender(gender) {
        this.writeToMetadata('gender',gender);
    }

    get age() {
        return this.metadata.age;
    }

    set age(age) {
        this.writeToMetadata('age',age);
    }

    get biography() {
        return this.metadata.biography;
    }

    set biography(biography) {
        this.writeToMetadata('biography',biography);
    }
}
