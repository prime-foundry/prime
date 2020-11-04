import { PRIME_DICE_ROLLER } from "./prime_dice_roller.js";

export class PRIME_DICE_POPUP extends Application {
	diceRoller = new PRIME_DICE_ROLLER();
	currentActor = null;
	sortedStats = {};

	constructor(...args) {
		super(...args)
		game.users.apps.push(this);
	}

	static get defaultOptions() {
		const options = super.defaultOptions;
		options.title = game.i18n.localize("PRIME.diceRoller.title");
		options.id = "primeDiceRoller";
		options.template = "systems/prime/templates/dice/roller.html";
		options.closeOnSubmit = true;
		options.popOut = true;
		options.width = 600;
		options.height = "auto";
		options.classes = ["prime-dice"];

		return options;
	}

	async getData() {
		// Return data to the template
		const actors = game.actors.entities;
		const users = game.users.entities;

		const primes = this.getPrimes();
		const refinements = this.getRefinements();
		if (!this.currentActor) {
			this.currentActor = actors[0];
		}
		this.getSortedActorStats(this.currentActor);
		return {
			actors,
			users,
			primes,
			refinements,
			sortedStats: this.sortedStats,
			currentActor: this.currentActor
			/*,
			abilities,
			saves,
			skills,
			specialRolls: LMRTFY.specialRolls,
			rollModes: CONFIG.Dice.rollModes,*/
		};
	}

	getSortedActorStats(currentActor) {

		const primes = currentActor.data.data.primes;
		const refinements = currentActor.data.data.refinements;
		var currEntry = null;
		this.sortedStats = {};
		for (var key in primes) {
			currEntry = primes[key];
			if (!this.sortedStats[currEntry.type]) {
				let localisedTitle = game.i18n.localize("PRIME.refinment_type_" + currEntry.type);
				this.sortedStats[currEntry.type] =
				{
					primes: {},
					refinements: {},
					title: localisedTitle
				}
			}
			this.sortedStats[currEntry.type].primes[key] = { value: currEntry.value, title: game.i18n.localize(currEntry.title), description: game.i18n.localize(currEntry.description) };
		}
		for (var key in refinements) {
			currEntry = refinements[key];
			this.sortedStats[currEntry.type].refinements[key] = { value: currEntry.value, title: game.i18n.localize(currEntry.title), description: game.i18n.localize(currEntry.description) };
		}
		return this.sortedStats;
	}

	getPrimes() {
		const primeData = game.system.template.Actor.templates.primes_template.primes
		if (primeData) {
			let primes = [];
			let currPrime = null;
			for (let currAbbrevation in primeData) {
				currPrime = primeData[currAbbrevation];
				primes.push({ name: currAbbrevation, title: game.i18n.localize(currPrime.title) });
			}
			return primes;
		}
		console.error("Unable to find Primes data.");
		return [];
	}

	getRefinements() {
		var refinementData = game.system.template.Actor.templates.refinements_template.refinements;
		if (refinementData) {
			var localisedRefinments = this.getLocalisedRefinments(refinementData);
			var catergorisedRefinementsList = [];

			for (var _currType in localisedRefinments) {
				catergorisedRefinementsList.push({
					name: "null",
					title: game.i18n.localize("PRIME.refinment_type_" + _currType)
				});

				catergorisedRefinementsList = catergorisedRefinementsList.concat(localisedRefinments[_currType]);
			}

			return catergorisedRefinementsList;
		}
		console.error("Unable to find Refinements data.");
		return [];
	}

	getLocalisedRefinments(refinementData) {
		let refinementGroups = {}
		let currGroupType = "";
		let currRefinement = null;
		for (let key in refinementData) {
			currRefinement = refinementData[key];
			currGroupType = currRefinement.type;

			if (!refinementGroups[currGroupType]) {
				refinementGroups[currGroupType] = [];
			}

			refinementGroups[currGroupType].push(
				{
					name: key,
					title: "&nbsp;&nbsp;" + game.i18n.localize(currRefinement.title)
				});

			refinementGroups[currGroupType].sort();
		}
		return refinementGroups;
	}

	render(force, context = {}) {
		// Only re-render if needed
		const { action, data } = context;
		if (action && !["create", "update", "delete"].includes(action)) return;
		//if (action === "update" && !data.some(d => "character" in d)) return;
		if (force !== true && !action) return;
		return super.render(force, context);
	}

	selectPrime(event) {
		console.log("select prime", event);
		this.toggleSelectionClasses(event);
		this.updateRoll(event);
	}

	selectRefinement(event) {
		console.log("select  refinement", event);
		this.toggleSelectionClasses(event);
		this.updateRoll(event);
	}
	updateRoll(event) {

		let firstTitle = this.element.find(".firstSelection .primeTitle");
		let secondTitle = this.element.find(".secondSelection .primeTitle");
		if (firstTitle.length == 0) {
			firstTitle = this.element.find(".firstSelection .refinementTitle");
		}
		if (secondTitle.length == 0) {
			secondTitle = this.element.find(".secondSelection .refinementTitle");
		}
		let firstValue = this.element.find(".firstSelection .primeValue");
		let secondValue = this.element.find(".secondSelection .primeValue");
		if (firstValue.length == 0) {
			firstValue = this.element.find(".firstSelection .refinementValue");
		}
		if (secondValue.length == 0) {
			secondValue = this.element.find(".secondSelection .refinementValue");
		}
		const rollButton = this.element.find(".rollPrimeDice");
		if (secondTitle.length == 0) {
			if (firstTitle.length == 0) {
				rollButton.text("Roll!");
			} else {
				rollButton.text("Roll Just " + firstTitle.text() + " (" + parseInt(firstValue.text()) + " + ?)");
			}
		} else if (firstTitle[0] == secondTitle[0]) {
			rollButton.text("Roll " + firstTitle.text() + " twice! (" + (parseInt(firstValue.text()) * 2) + " + ?)");
		} else {
			rollButton.text("Roll " + firstTitle.text() + " + " + secondTitle.text() + " (" + (parseInt(firstValue.text()) + parseInt(secondValue.text())) + " + ?)");
		}
	}

	toggleSelectionClasses(event) {

		const thisElement = $(event.delegateTarget)
		const firstElement = this.element.find(".firstSelection")
		const secondElement = this.element.find(".secondSelection")
		if (firstElement.length > 0 && secondElement.length > 0 && firstElement[0] == secondElement[0]) {
			if (thisElement[0] == firstElement[0]) {
				thisElement.toggleClass("firstSelection");
				thisElement.toggleClass("secondSelection");
				// thisElement = no selection.
			} else {
				firstElement.toggleClass("secondSelection");
				// firstElement = firstSelection.
				thisElement.toggleClass("secondSelection");
				// thisElement = secondSelecton.
			}
		} else if (firstElement.length > 0 && thisElement[0] == firstElement[0]) {
			if (secondElement.length > 0) {
				thisElement.toggleClass("firstSelection");
				thisElement.toggleClass("secondSelection");
				// thisElement = secondSelection.
				secondElement.toggleClass("firstSelection");
				secondElement.toggleClass("secondSelection");
			} else {
				thisElement.toggleClass("secondSelection");
				// thisElement = secondSelection & firstSelection.
			}
			// secondElement = firstSelection.
		} else if (secondElement.length > 0 && thisElement[0] == secondElement[0]) {
			firstElement.toggleClass("firstSelection");
			// firstElement = no selection
			thisElement.toggleClass("firstSelection");
			// thisElement = secondSelection & firstSelection
		} else if (secondElement.length > 0) {

			firstElement.toggleClass("firstSelection");
			// firstElement = no selection
			secondElement.toggleClass("firstSelection");
			secondElement.toggleClass("secondSelection");
			// secondElement = firstSelection.
			thisElement.toggleClass("secondSelection");
			// thisElement = secondSelection.
		} else if (firstElement.length > 0) {
			thisElement.toggleClass("secondSelection");
		} else {
			thisElement.toggleClass("firstSelection");
		}
	}

	selectActor(event) {
		console.log("select  actor", event);
		const actors = game.actors;
		this.currentActor = game.actors.get(event.target.value);
		this.getSortedActorStats(this.currentActor);
		this.render(false, { action: "update" });
	}

	activateListeners(html) {
		super.activateListeners(html);
		this.element.find(".rollPrimeDice").click((event) => this.diceRoller.rollPrimeDice(event, true));
		this.element.find(".selectPrime").click((event) => this.selectPrime(event));
		this.element.find(".selectRefinement").click((event) => this.selectRefinement(event));
		const actorSelect = this.element.find("#primeDiceRollerActorSelect");

		const currentSelect = this.element.find("#primeDiceRollerActorSelect option[value='" + this.currentActor.id + "']");
		currentSelect.attr('selected', 'selected');
		actorSelect.change((event) => this.selectActor(event));
	}
}