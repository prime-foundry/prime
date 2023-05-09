import { PRIME_DICE } from "../prime_dice/prime_dice.js";
import { AWARD_XP } from "../xp/award_xp.js";

Hooks.on("getSceneControlButtons", (controls) => {

    const isGM = game.user.isGM;
    const basicControls = controls[0];
    basicControls.tools.push({
        name: "prime-roll",
        title: game.i18n.localize("PRIME.controls_roll_title"),
        icon: "fas fa-dice-d20",
        button: true,
        // onClick: () => PRIME_DICE.openPrimeDice("primeControl"),
    });
    basicControls.tools.push({
        name: "prime-xp",
        title: game.i18n.localize("PRIME.controls_xp_title"),
        icon: "game-icon game-icon-trophy-cup",
        visible: isGM,
    });
});

// export class PrimeLayer extends CanvasLayer {

// }


Hooks.on("renderSceneControls", () => {

    let primeRoll = $("li[data-tool=\"prime-roll\"].control-tool");
    primeRoll.addClass("prime-control prime-control-roll");
    let rollOffset = primeRoll.offset();
    let rollWidth = primeRoll.width();
    // let height = primeRoll.height();

    $(primeRoll).click(instance => {

        PRIME_DICE.openPrimeDice("primeControl", rollOffset.left+rollWidth+12, rollOffset.top);
    });

    
    let awardXP = $("li[data-tool=\"prime-xp\"].control-tool");
    awardXP.addClass("prime-control prime-control-xp");
    
    let xpOffset = awardXP.offset();
    let xpWidth = awardXP.width();

    
    $(awardXP).click(instance => {
        AWARD_XP.openAwardXP("primeControl", xpOffset.left+xpWidth+12, xpOffset.top);
    });

    // there appears to be something a bit dodgy going on when we click a button when this is evaluated, 
    // the page is rerendered and so the tool tip thinks we are at 0,0 
    // so to fix we get the location of the button (and its dimensions) after the first render.
    // tippy(primeRoll.get(0), {
    //     content: 'Prime Roll',
    //     trigger: 'click',
    //     // interactive: true,
    //     allowHTML: true,
    //     getReferenceClientRect: () => ({
    //         width: width,
    //         height: height,
    //         left: offset.left,
    //         right: offset.left + width,
    //         top: offset.top,
    //         bottom: offset.top + height,
    //     }),
    //     placement: 'right',
    //     onMount(instance) {
    //         // ...
    //     },
    //     onShown(instance) {

    //         let wrapper = $('#primeDiceRoller');
    //         instance.setContent(wrapper.get(0));
    //     },
    // });
    // $('li[data-control="primeCoreControl"]')[0].onclick = () => {
    //     PRIME_DICE.openPrimeDice("primeControl");
    // initMap();
    // minimap_data.minimapapp.render(true);
    // minimap_data.shown = true;
    // if (minimap_data.hooked == false) {
    //     Hooks.on('canvasPan', async function() {
    //         resSqau();
    //     });
    //     Hooks.on('createToken', async function() {
    //         resSqau();
    //     });
    //     Hooks.on('deleteActor', async function() {
    //         resSqau();
    //     });
    //     Hooks.on('deleteToken', async function() {
    //         resSqau();
    //     });
    //     Hooks.on('updateToken', async function() {
    //         resSqau();
    //     });
    // };
    // }
});
