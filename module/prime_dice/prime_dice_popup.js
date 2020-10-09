import { PRIME_DICE_ROLLER } from "./prime_dice_roller.js";

export class PRIME_DICE_POPUP extends FormApplication
{
	diceRoller = new PRIME_DICE_ROLLER();

	constructor(...args)
	{
        super(...args)
		game.users.apps.push(this);
    }

	static get defaultOptions()
	{
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

	async getData()
	{
        // Return data to the template
        const actors = game.actors.entities;
		const users = game.users.entities;

		const primes = this.getPrimes();
		const refinements = this.getRefinements();
		
        return {
            actors,
			users,
			primes,
			refinements
			/*,
            abilities,
            saves,
            skills,
            specialRolls: LMRTFY.specialRolls,
            rollModes: CONFIG.Dice.rollModes,*/
        };
	}

	getPrimes()
	{
		if (game.system.template.Actor.character.primes)
		{
			let primes = [];
			let currPrime = null;
			let primesSource = game.system.template.Actor.character.primes
			for (let currAbbrevation in primesSource)
			{
				currPrime = primesSource[currAbbrevation];
				primes.push({name: currAbbrevation, title: game.i18n.localize(currPrime.title)});
			}
			return primes;
		}
		console.error("Unable to find Primes data.");
		return [];	
	}

	getRefinements()
	{
		var refinementData = game.system.template.Actor.character.refinements;
		if (refinementData)
		{
			var localisedRefinments = this.getLocalisedRefinments(refinementData);
			var catergorisedRefinementsList = [];

			for (var _currType in localisedRefinments)
			{
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

	getLocalisedRefinments(refinementData)
	{
		let refinementGroups = {}
		let currGroupType = "";
		let currRefinement = null;
		for (let key in refinementData)
		{
			currRefinement = refinementData[key];
			currGroupType = currRefinement.type;

			if (!refinementGroups[currGroupType])
			{
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

	render(force, context={})
	{
        // Only re-render if needed
        const {action, data} = context;
        if (action && !["create", "update", "delete"].includes(action)) return;
        if (action === "update" && !data.some(d => "character" in d)) return;
        if (force !== true && !action) return;
        return super.render(force, context);
    }
    
	activateListeners(html)
	{
		super.activateListeners(html);
		this.element.find(".rollPrimeDice").click((event) => this.diceRoller.rollPrimeDice(event, true));
	}
}