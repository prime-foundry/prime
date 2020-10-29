import { PRIME_DICE } from "../prime_dice/prime_dice.js";

Hooks.on("getSceneControlButtons", (controls) => {

    controls.push({
        name: "primeCoreControl",
        title: "Prime Controls",
        // layer: "NotesLayer",
        icon: "fas fa-dice-d20",
        activeTool: 'select',
        tools: [{
            name: "select",
            title: "Prime Controls",
            icon: "fas fa-expand",
        }],
    });
});


Hooks.on("renderSceneControls", () => {

    $('li[data-control="primeCoreControl"]')[0].onclick = () => {
        PRIME_DICE.openPrimeDice("primeControl");
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
    }
});
