import { PrimeTables } from "../prime_tables.js";
import {getComponentLazily} from "../util/support.js";
import Profile from "./components/Profile.js";
import Stats from "./components/Stats.js";
import Health from "./components/Health.js";
import {ActionPoints, Soul, XP} from "./components/Points.js";
import {DynDocumentMixin} from "../util/DynFoundryMixins.js";

import { PrimeItemManager } from "../item/PrimeItemManager.js";
import Notes from "./components/Notes.js";
import Armour from "./components/Armour.js";
import Perks from "./components/Perks.js";
import Actions from "./components/Actions.js";
import Inventory from "./components/Inventory.js";
/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple gameSystem.
 * @extends {Actor}
 */
export class PrimeActor extends DynDocumentMixin(Actor, 'actor')
{
	/**
	 * @return {Profile}
	 */
	get profile() {
		return getComponentLazily(this, 'profile', Profile);
	}

	/**
	 * @return {Stats}
	 */
	get stats(){
		return getComponentLazily(this, 'stats', Stats);
	}

	/**
	 * @return {Health}
	 */
	get health() {
		return getComponentLazily(this, 'health', Health);
	}

	/**
	 * @return {Armour}
	 */
	get armour(){
		return getComponentLazily(this, 'armour', Armour);
	}

	/**
	 * @return {ActionPoints}
	 */
	get actionPoints() {
		return getComponentLazily(this, 'actionPoints', ActionPoints);
	}

	/**
	 * @return {Perks}
	 */
	get perks(){
		return getComponentLazily(this, 'perks', Perks);
	}

	/**
	 * @return {Actions}
	 */
	get actions(){
		return getComponentLazily(this, 'actions', Actions);
	}
	/**
	 * @return {Inventory}
	 */
	get inventory(){
		return getComponentLazily(this, 'inventory', Inventory);
	}


	/**
	 * @return {Notes}
	 */
	get notes() {
		return getComponentLazily(this, 'notes', Notes);
	}

	isCharacter() {
		return this.type === "character";
	}


	get version() {
		if(this.data.data.sheetVersion) {
			switch (this.data.data.sheetVersion) {
				case "v2.0":
					return 2;
			}
		}
		return 1;
	}

	/**
	 * @return {XP}
	 */
	get xp() {
		return getComponentLazily(this, 'xp', XP);
	}

	/**
	 * @return {Soul}
	 */
	get soul() {
		return getComponentLazily(this, 'soul', Soul);
	}

	set actionPoints(value) {
		this.actionPoints.value = value;
	}

	/**
	 * @return {User[]}
	 * @protected
	 */
	get _owners() {
		return Object.entries(this.data.permission || {})
			.filter(([key, permission]) => {
				return key != 'default' && permission == 3;
			})
			.map(([key,]) => {
				return game.users.get(key);
			})
			.filter((user) => !!user && !user.isGM);
	}

	// Change to _preCreate() - read up!
	_onCreate(data, options, userId)
	{
		const ret = super._onCreate(data, options, userId);
		const requestData =
		{
			itemBaseTypes: ["prime", "refinement"],
			filtersData: {data:{data:{metadata: {default: true}}}},
			matchAll: false,
			justContentData: true,
			sortItems: true
		};

		const primeAndRefinementItemsToCreate = PrimeItemManager.getItems(requestData);
		primeAndRefinementItemsToCreate.filter(item => item.type === 'prime')
			.forEach(item => item.data.value = 1);
		// top level method is not async, so we just have to let this run asynchronously.
		this.createEmbeddedDocuments("Item", primeAndRefinementItemsToCreate).then(() => this.update());
		return ret;
	}

}