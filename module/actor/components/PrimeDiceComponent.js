import Component from "../../util/Component.js";
import {PRIME_DICE_ROLLER} from "../../dice/prime_dice_roller.js";
function removeAllCssClassesFromView(view, cssClass){

    const nodeList = view.getElementsByClassName(cssClass);

    for(let i = 0; i< nodeList.length;i++){
        nodeList.item(i).classList.remove(cssClass);
    }
}
export default class PrimeDiceComponent extends Component {

    primeId;
    refinementId;
    modifier = 0;

    get preparing() {
        return (this.primeId != null || this.refinementId != null);
    }

    get ready() {
        return (this.primeId != null && this.refinementId != null);
    }

    get selectedPrimeId() {
        return this.primeId;
    }

    get selectedRefinementId() {
        return this.refinementId;
    }

    selectPrimeToRoll({id,  html}) {
        const {view, element} = html;
        console.log(id);
        removeAllCssClassesFromView(view, "selectedRollerPrime");
        if (this.primeId === id) {
            console.log("Prime not rolling " + id);
            this.primeId = null;
        } else {
            console.log("Prime To roll " + id);
            this.primeId = id;
            element.parentElement.classList.add("selectedRollerPrime");
        }
        this.manageDiceBar(view);
    }

    selectRefinementToRoll({id, html}) {
        const {view, element} = html;
        console.log(id);
        removeAllCssClassesFromView(view, "selectedRollerRefinement");
        if (this.refinementId === id) {
            console.log("Refinement not rolling " + id);
            this.refinementId = null;
        } else {
            console.log("Refinement To roll " + id);
            this.refinementId = id;
            element.parentElement.classList.add("selectedRollerRefinement");
        }
        this.manageDiceBar(view);
    }

    manageDiceBar(view) {
        const tabList = view.getElementsByClassName("rollerTab");
        const tab =  tabList.item(0);
        const diceBarList = view.getElementsByClassName("rollerBar");
        const diceBar =  diceBarList.item(0);
        if(this.ready){
            diceBar.classList.add('active');
            tab.classList.remove('rollerPreparing');
            tab.classList.add('rollerReady');
        } else if(this.preparing){
            diceBar.classList.add('active');
            tab.classList.add('rollerPreparing');
            tab.classList.remove('rollerReady');
        } else {
            diceBar.classList.remove('active');
            tab.classList.remove('rollerReady');
            tab.classList.remove('rollerPreparing');
        }
    }


    async roll() {
        if (this.ready) {
            const actor = this.document;
            const prime = actor.stats.primes.getStatById(this.primeId);
            const refinement = actor.stats.refinements.getStatById(this.refinementId);
            const primeValue = prime.value;
            const refinementValue = refinement.value;
            const total = primeValue + refinementValue;
            const users = Array.from(game.users.values()).filter(user => user.isSelf);
            const roller = new PRIME_DICE_ROLLER();
            const rollMode = "roll";
            const modifier = this.modifier;
            const diceParams = {
                user: users[0],
                actor,
                rollMode,
                prime,
                refinement,
                total,
                modifier
            };
            this.primeId = null;
            this.refinementId = null;
            return roller.rollPrimeDice(diceParams)
        }
        this.primeId = null;
        this.refinementId = null;
    }
}