import Component from "../../util/Component.js";
import {PRIME_DICE_ROLLER} from "../../dice/prime_dice_roller.js";
import {htmlToText} from "../../util/support.js";

function removeAllCssClassesFromView(view, cssClass) {

    const nodeList = view.getElementsByClassName(cssClass);

    for (let i = 0; i < nodeList.length; i++) {
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

    get prime() {
        const actor = this.document;
        const prime = actor.stats.primes.getStatById(this.primeId);
        return prime;
    }

    get refinement() {
        const actor = this.document;
        const refinement = actor.stats.refinements.getStatById(this.refinementId);
        return refinement;
    }

    get selectedRefinementId() {
        return this.refinementId;
    }

    dismiss({html}) {
        const view = html.view;
        this.refinementId = null;
        this.primeId = null;
        removeAllCssClassesFromView(view, "selectedRollerRefinement");
        removeAllCssClassesFromView(view, "selectedRollerPrime");
        this.manageDiceBar(view);
    }

    selectPrimeToRoll({id, html}) {
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

    setNavPrimeValue(view) {
        const prime = this.prime;
        const value = prime != null ? prime.name : ''
        const element = view.querySelector(".rollerBar .rollerPrime .value");
        element.innerHTML = htmlToText(value);
    }

    setNavRefinementValue(view) {
        const refinement = this.refinement;
        const value = refinement != null ? refinement.name : ''
        const element = view.querySelector(".rollerBar .rollerRefinement .value");
        element.innerHTML = htmlToText(value);
    }

    manageDiceBar(view) {
        const tabList = view.getElementsByClassName("rollerTab");
        const tab = tabList.item(0);
        const diceBarList = view.getElementsByClassName("rollerBar");
        const diceBar = diceBarList.item(0);
        this.setNavPrimeValue(view);
        this.setNavRefinementValue(view);
        if (this.ready) {
            diceBar.classList.add('active');
            tab.classList.remove('rollerPreparing');
            tab.classList.add('rollerReady');
        } else if (this.preparing) {
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
            const prime = this.prime;
            const refinement = this.refinement;
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