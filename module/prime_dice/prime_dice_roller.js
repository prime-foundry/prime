export class PRIME_DICE_ROLLER {

	async rollPrimeDice(diceParams) {
		
		const currentRoll = new Roll('1dp');
		currentRoll.evaluate();
		const diceResult = this.getDiceResult(currentRoll, diceParams);
		const messageContent = await this.createContent(diceResult);
		const alias =  `${diceResult.user}: ${diceResult.actor}`;
		const speaker = ChatMessage.getSpeaker({ actor : diceParams.actor, alias });
		let data =
		{
			speaker,
			user: game.user._id,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			sound: CONFIG.sounds.dice,
			content: messageContent,
		};
		data.roll = currentRoll;
		let options = {rollMode: diceParams.rollMode};
		CONFIG.ChatMessage.entityClass.create(data, options);
	}

	getDiceResult(roll, diceParams) {
		return {
			actorID: diceParams.actor.id,
			actor: diceParams.actor.name,
			user: diceParams.user.name,
			actorImg: diceParams.actor.img,
			userColour: chroma(diceParams.user.data.color).darken(3).hex(),
			diceRolls:  roll.dice[0].results,
			totalDice: roll.total,
			total: diceParams.total + roll.total,
			rollMode: diceParams.rollMode,
			modifiers: this.getDiceModifiers(diceParams)
		};
	}
	getDiceModifiers(diceParams) {
		let modifiers = [];

		if (diceParams.prime) {
			const prime = diceParams.actor.getPrimes()[diceParams.prime.key];
			const localizedPrime = game.i18n.localize(prime.title);
			modifiers.push({name:localizedPrime, value:diceParams.prime.value});
			if (diceParams.prime.doubled) {
				modifiers.push({name:localizedPrime, value:diceParams.prime.value});
			} else if (diceParams.refinement) {
				const refinement = diceParams.actor.getRefinements()[diceParams.refinement.key];
				const localizedRefinement = game.i18n.localize(refinement.title);
				modifiers.push({name:localizedRefinement, value:diceParams.refinement.value});
			}
		} else if (diceParams.refinement) {
			const refinement = diceParams.actor.getRefinements()[diceParams.refinement.key];
			const localizedRefinement = game.i18n.localize(refinement.title);
			modifiers.push({name:localizedRefinement, value:diceParams.refinement.value});
		}
		if(diceParams.modifier){
			modifiers.push({name:"Modifier", value:diceParams.modifier});
		}
		return modifiers;
	}

	async createContent(diceResult) {
		const handlebarsTemplate = await getTemplate("systems/prime/templates/dice/prime_result.html");
		const messageContent = handlebarsTemplate(diceResult);
		return messageContent;
	}

	static onRenderChatMessage(message, html, data) {
		if(message.speaker && message.speaker.actor){
			const actorID = message.speaker.actor;
			html.find('.actorPortrait').click((() => {
				const actors = CONFIG.Actor.collection.instance;
				const actor = actors.get(actorID);
				actor.sheet.render(true);
			}));
		}
	}
}

Handlebars.registerHelper('primeDiceClass', function (value) {
	if (value === 1) {
		return "misfortunePrimeRoll lowPrimeRoll";
	}
	if (value === 20) {
		return "fortunePrimeRoll highPrimeRoll";
	}
	if (value < 9) {
		return "lowPrimeRoll";
	}
	if (value > 12) {
		return "highPrimeRoll";
	}
	return "";
});

Handlebars.registerHelper('primeDiceModifierClass', function (value) {
	if (value > 0) {
		return "highPrimeModifierResult";
	}
	if (value < 0) {
		return "lowPrimeModifierResult";
	}
	return "";
});
Handlebars.registerHelper('loadActorSheet', function (value) {
	return `function() {CONFIG.Actor.get('${value}').sheet.render(true);}`;
});

Hooks.on('renderChatMessage', PRIME_DICE_ROLLER.onRenderChatMessage);