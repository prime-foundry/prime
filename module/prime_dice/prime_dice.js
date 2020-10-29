import { PRIME_DICE_POPUP } from "./prime_dice_popup.js";

export class PRIME_DICE
{
	static dicePopup = null;

	static async init()
	{
	}

	static ready()
	{
	}

	static onRenderChatLog()
	{
		PRIME_DICE.attachToRollDiceIcon()
	}

	static attachToRollDiceIcon()
	{
		var diceIcon = $('.chat-control-icon .fas.fa-dice-d20');
		
		diceIcon.on('click', (event) => {
			PRIME_DICE.openPrimeDice("rollDiceIcon");
		});
	}

	static openPrimeDice()
	{
		if (!PRIME_DICE.dicePopup)
		{
			PRIME_DICE.dicePopup = new PRIME_DICE_POPUP();
		}
		PRIME_DICE.dicePopup.render(true);
	}

}

Hooks.once('init', PRIME_DICE.init);
Hooks.on('ready', PRIME_DICE.ready);
Hooks.on('renderChatLog', PRIME_DICE.onRenderChatLog);
