import Component from "../util/Component.js";

function getUser(){
    return Array.from(game.users.values()).find(user => user.isSelf);
}
export default class PrimeUser extends Component{
    constructor() {
        super(getUser());
    }
    /**
     * @return {PrimeUser}
     * @protected
     */
    get _root() {
        return super._root;
    }
    /**
     * @return {User}
     * @protected
     */
    get _user() {
        return this._parent;
    }

    get name(){
        return this._user.name;
    }
}