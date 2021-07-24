import Migration from "./Migration.js";

export default class PrimeMigration_0_4_1 extends Migration
{
	static async migrate() {
		return true;
	}

	static get version(){
		return '0.4.1';
	}

}