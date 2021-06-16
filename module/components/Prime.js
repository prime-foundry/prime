import PrimeActor from "./actor/PrimeActor.js";
import PrimeUser from "./user/PrimeUser.js";
import PrimeController from "./PrimeController.js";

function getUser(){
    return Array.from(game.users.values()).find(user => user.isSelf);
}
export default class Prime {

    constructor(data, sheet, sheetData) {
        this.__data = data;
        this.__controller = new PrimeController(sheet,sheetData);
    }

    get _controller() {
        return this.__controller;
    }

    get actor() {
        if(!this.__actor){
            const {actor} = this.__data;
            this.__actor = new PrimeActor(actor, this._controller);
        }
        return this.__actor;
    }

    get user() {
        if(!this.__user){
            const {user} = this.__data;
            this.__user = new PrimeUser(user || getUser(), this._controller);
        }
        return this.__user;
    }
}