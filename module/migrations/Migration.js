export default class Migration {

    /**
     *  Here we fill in the new values
     * @returns {Promise<boolean>}
     */
    static async migrate() {
        return false;
    }

    static get version(){
        return 0;
    }
}