import { PRIME_DICE } from "../prime_dice/prime_dice.js";

Hooks.on("getSceneControlButtons", (controls) => {

    const isGM = game.user.isGM;
    const basicControls = controls[0];
    basicControls.tools.push({
        name: "prime-roll",
        title: game.i18n.localize("PRIME.controls_roll_title"),
        icon: "fas fa-dice-d20",
        cssClass: "prime-button",
        button: true,
        onClick: () => PRIME_DICE.openPrimeDice("primeControl"),
    });
    basicControls.tools.push({
        name: "prime-xp",
        title: game.i18n.localize("PRIME.controls_xp_title"),
        icon: "game-icon game-icon-aura",
        cssClass: "prime-button",
        visible: isGM,
    });

});

// export class PrimeLayer extends CanvasLayer {

// }


Hooks.on("renderSceneControls", () => {
    $('li[data-tool="prime-roll"].control-tool').addClass("prime-control");
    $('li[data-tool="prime-xp"].control-tool').addClass("prime-control");
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
