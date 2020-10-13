//import Mustache from 'mustache';

export class PRIME_DICE_ROLLER extends FormApplication
{
	primeTable = [-5,-4,-3,-2,-2,-1,-1,-1,0,0,0,0,1,1,1,2,2,3,4,5];

	constructor(...args)
	{
        super(...args)
        game.users.apps.push(this)
    }

	async rollPrimeDice()
	{
		var diceResult = this.getDiceResult();
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

	getDiceResult()
	{
		var currentDie = new Die(20);
		this.rollDie(currentDie);
		var primeDiceResult = this.getPrimeDiceResultData(currentDie);
		//if (primeDiceResult.diceRolls.length > 2)
		//{
		//	console.log(primeDiceResult);
		//}
		return primeDiceResult;
	}

	rollDie(whatDie)
	{
		whatDie.roll(1);
		var lastDice = whatDie.rolls[whatDie.rolls.length - 1]
		if (lastDice.roll == 1 || lastDice.roll == 20)
		{
			this.rollDie(whatDie);
		}
	}

	getPrimeDiceResultData(foundryDice)
	{
		var _modifier = 0;
		var _primeResults = foundryDice.rolls.map(currResult => 
		{
			let _primeModifier = this.primeTable[currResult.roll - 1];
			_modifier += _primeModifier;
			return {...currResult, primeModifier: _primeModifier};
		});

		var _primeDiceResults =
		{
			diceRolls: _primeResults,
			total: _modifier
		};
		return _primeDiceResults;
	}

	async createContent(diceResult)
	{
		var handlebarsTemplate = await getTemplate("modules/PrimeDice/templates/prime_result.html");
		var messageContent = handlebarsTemplate(diceResult);
		return messageContent
	}

	async _updateObject(event, formData)
	{
	}
	
	testDiceRolling(_testIterations)
	{
		var count = 0
		var _resultsObject = {}
		while (count < _testIterations)
		{
			let result = this.getDiceResult().total;
			if (!_resultsObject[result])
			{
				_resultsObject[result] = {total: 0};
			}
			_resultsObject[result].total++;
			count++;
		}

		count = 0;

		for (var _currResult in _resultsObject)
		{
			_resultsObject[_currResult].percentage = (_resultsObject[_currResult].total / _testIterations) * 100;
			count++;
		}

		console.log(_resultsObject);
	}
}

Handlebars.registerHelper('primeDiceClass', function(value)
{
	if (value === 1)
	{
		return "misfortunePrimeRoll lowPrimeRoll";
	}
	if (value === 20)
	{
		return "fortunePrimeRoll highPrimeRoll"
	}

	if (value < 9)
	{
		return "lowPrimeRoll";
	}
	if (value > 12)
	{
		return "highPrimeRoll"
	}
	return "";
});

Handlebars.registerHelper('primeDiceModiferClass', function(value)
{
	if (value > 0)
	{
		return "highPrimeModifierResult";
	}
	if (value < 0)
	{
		return "lowPrimeModifierResult";
	}
	return "";
});