import DataEditor from "../util/DataManager.js";

export default class PrimeUser extends DataEditor{
    constructor(user, controller) {
        super(user, controller);
    }

    /**
     * @return {User}
     * @protected
     */
    get _user() {
        return this._document;
    }

    get name(){
        return this._user.name;
    }
}