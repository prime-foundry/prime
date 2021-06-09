import PrimeActor from "./actor/PrimeActor.js";
import PrimeUser from "./user/PrimeUser.js";

export default class Prime {

    constructor(data) {
        this.__data = data;
    }

    get actor() {
        if(!this.__actor){
            this.__actor = new PrimeActor(this.__data);
        }
        return this.__actor;
    }

    get user() {
        if(!this.__user){
            this.__user = new PrimeUser();
        }
        return this.__user;
    }
}