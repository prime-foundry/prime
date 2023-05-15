import { XP_POPUP } from "./xp_popup.js";

export class AWARD_XP
{
    constructor()
    {
        this.xpPopup = null;
    }

    static async init()
    {
    }

    static ready()
    {
    }


    static openAwardXP(title, left, top)
    {
        let options = { left: left, top: top, log: title };
        if (!AWARD_XP.xpPopup)
        {
            AWARD_XP.xpPopup = new XP_POPUP(options);
        }
        else if (left || top)
        {
            AWARD_XP.xpPopup.position.left = left;
            AWARD_XP.xpPopup.position.top = top;
        }
        AWARD_XP.xpPopup.render(true, options);
    }

}

Hooks.once("init", AWARD_XP.init);
Hooks.on("ready", AWARD_XP.ready);
