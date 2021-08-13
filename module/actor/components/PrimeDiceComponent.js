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

    open = false;
    primeId;
    refinementId;
    modifier = 0;
    visibility = 'roll';

    get preparing() {
        return this.open;
    }

    get ready() {
        return this.open && this.primeId != null && this.refinementId != null;
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
        this.open = false;
        removeAllCssClassesFromView(view, "selectedRollerRefinement");
        removeAllCssClassesFromView(view, "selectedRollerPrime");
        this.manageDiceBar(view);
    }

    selectPrimeToRoll({id, html}) {
        const {view, element} = html;
        this.open = true;
        if (this.primeId === id) {
            this.primeId = null;
        } else {
            this.primeId = id;
        }
        this.manageDiceBar(view);
    }

    selectRefinementToRoll({id, html}) {
        const {view, element} = html;
        this.open = true;
        if (this.refinementId === id) {
            this.refinementId = null;
        } else {
            this.refinementId = id;
        }
        this.manageDiceBar(view);
    }
    setNavPrimeText(view) {
        const prime = this.prime;
        const value = prime != null ? `${prime.name}:` : ''
        const element = view.querySelector(".rollerBar .rollerPrime .text");
        element.innerHTML = htmlToText(value);
    }

    setNavRefinementText(view) {
        const refinement = this.refinement;
        const value = refinement != null ? `${refinement.name}:` : ''
        const element = view.querySelector(".rollerBar .rollerRefinement .text");
        element.innerHTML = htmlToText(value);
    }
    setNavPrimeValue(view) {
        const prime = this.prime;
        const value = prime != null ? `${prime.value}` : ''
        const element = view.querySelector(".rollerBar .rollerPrime .value");
        element.innerHTML = htmlToText(value);
    }

    setNavRefinementValue(view) {
        const refinement = this.refinement;
        const value = refinement != null ? `${refinement.value}` : ''
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
        this.setNavPrimeText(view);
        this.setNavRefinementText(view);
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
        removeAllCssClassesFromView(view, "selectedRollerPrime");
        removeAllCssClassesFromView(view, "selectedRollerRefinement");
        if(this.open){
            if(this.primeId != null){
                const primeElement = view.querySelector(`.primeWrapper[data-prime-id="${this.primeId}"]`);
                primeElement.classList.add("selectedRollerPrime");
            }
            if(this.refinementId != null) {
                const refinementElement = view.querySelector(`.refinementWrapper[data-refinement-id="${this.refinementId}"]`);
                refinementElement.classList.add("selectedRollerRefinement");
            }
        }
    }


    async roll({html}) {
        if (this.ready) {
            const actor = this.document;
            const prime = this.prime;
            const refinement = this.refinement;
            const primeValue = prime.value;
            const refinementValue = refinement.value;
            const total = primeValue + refinementValue;
            const users = Array.from(game.users.values()).filter(user => user.isSelf);
            const roller = new PRIME_DICE_ROLLER();
            const rollMode = this.visibility;
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
            await roller.rollPrimeDice(diceParams)
        } else if(this.open) {
            this.dismiss({html});
        } else {
            this.open = true;
            const view = html.view;

            this.manageDiceBar(html.view);

            // find the element on the view and reshow those elements.
        }
    }
}