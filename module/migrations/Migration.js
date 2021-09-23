export default class Migration {
static SUCCESS_REASON = 'Goats located.';
    /**
     *
     * @returns {can: boolean, reason: string}
     */
    static async canMigrate() {
        return {can:true,reason:Migration.SUCCESS_REASON};
    }


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