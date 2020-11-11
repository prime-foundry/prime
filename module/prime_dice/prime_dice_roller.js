//import Mustache from 'mustache';

export class PRIME_DICE_ROLLER {
	primeTable = [-5, -4, -3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5];


	async rollPrimeDice(diceParams) {
		var diceResult = this.getDiceResult(diceParams);
		var messageContent = await this.createContent(diceResult);
		let data =
		{
			sound: CONFIG.sounds.dice,
			content: messageContent
		};
		let options = {};
		ChatMessage.create(data, options);

		//this.testDiceRolling(10000);

	}

	getDiceResult(diceParams) {
		const currentDie = new Die({ faces: 20 });
		this.rollDie(currentDie);
		const primeDiceResult = this.getPrimeDiceResultData(currentDie, diceParams);
		//if (primeDiceResult.diceRolls.length > 2)
		//{
		//	console.log(primeDiceResult);
		//}
		return primeDiceResult;
	}

	rollDie(whatDie) {
		whatDie.roll(1);
		var lastDice = whatDie.results[whatDie.results.length - 1]
		if (lastDice.result == 1 || lastDice.result == 20) {
			this.rollDie(whatDie);
		}
	}

	getPrimeDiceResultData(foundryDice, diceParams) {
		var _result = 0;
		var _primeResults = foundryDice.results.map(currResult => {
			let _primeModifier = this.primeTable[currResult.result - 1];
			_result += _primeModifier;
			return { ...currResult, primeModifier: _primeModifier };
		});

		var _primeDiceResults =
		{
			actor: diceParams.actor.name,
			user: diceParams.user.name,
			actorImg: diceParams.actor.img,
			userColour: diceParams.user.data.color,
			diceRolls: _primeResults,
			totalDice: _result,
			total: diceParams.total + _result,
			calculation: this.getCalculationText(_result, diceParams)
		};
		return _primeDiceResults;
	}

	getCalculationText(diceResult, diceParams) {
		const primeData = game.system.template.Actor.templates.primes_template.primes
		const refinementData = game.system.template.Actor.templates.refinements_template.refinements;
		const result = diceResult < 0 ? " - " + (-diceResult) : " + " + diceResult;
	
		if (diceParams.prime) {
			const localizedPrime = game.i18n.localize(primeData[diceParams.prime.key].title);
			if (diceParams.prime.doubled) {
				return localizedPrime + " (" + diceParams.prime.value + ") + " + localizedPrime + " (" + diceParams.prime.value + ")" + result;
			} else if (diceParams.refinement) {
				const localizedRefinement = game.i18n.localize(refinementData[diceParams.refinement.key].title);
				return localizedPrime + " (" + diceParams.prime.value + ") + " + localizedRefinement + " (" + diceParams.refinement.value + ")" + result;
			} else {
				return localizedPrime + " (" + diceParams.prime.value + ")" + result;
			}
		} else if (diceParams.refinement) {
			const localizedRefinement = game.i18n.localize(refinementData[diceParams.refinement.key].title);
			return localizedRefinement + " (" + diceParams.refinement.value + ")" + result;
		}
		return "";
	}

	async createContent(diceResult) {
		var handlebarsTemplate = await getTemplate("systems/prime/templates/dice/prime_result.html");
		var messageContent = handlebarsTemplate(diceResult);
		return messageContent
	}

	testDiceRolling(_testIterations) {
		var count = 0
		var _resultsObject = {}
		while (count < _testIterations) {
			let result = this.getDiceResult().total;
			if (!_resultsObject[result]) {
				_resultsObject[result] = { total: 0 };
			}
			_resultsObject[result].total++;
			count++;
		}

		count = 0;

		for (var _currResult in _resultsObject) {
			_resultsObject[_currResult].percentage = (_resultsObject[_currResult].total / _testIterations) * 100;
			count++;
		}

		console.log(_resultsObject);
	}
}

Handlebars.registerHelper('primeDiceClass', function (value) {
	if (value === 1) {
		return "misfortunePrimeRoll lowPrimeRoll";
	}
	if (value === 20) {
		return "fortunePrimeRoll highPrimeRoll"
	}

	if (value < 9) {
		return "lowPrimeRoll";
	}
	if (value > 12) {
		return "highPrimeRoll"
	}
	return "";
});

Handlebars.registerHelper('primeDiceModiferClass', function (value) {
	if (value > 0) {
		return "highPrimeModifierResult";
	}
	if (value < 0) {
		return "lowPrimeModifierResult";
	}
	return "";
});