import Component from "../../util/Component.js";
import {PRIME_DICE_ROLLER} from "../../dice/prime_dice_roller.js";
import {htmlToText} from "../../util/support.js";
import {PrimeHandlebarsPartials} from "../../prime_handlebars.js";

function removeAllCssClassesFromView(view, cssClass) {

    const nodeList = view.getElementsByClassName(cssClass);

    for (let i = 0; i < nodeList.length; i++) {
        nodeList.item(i).classList.remove(cssClass);
    }
}

export default class ActorDiceController extends Component {

    open = false;
    primeId;
    refinementId;
    actionId;
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

    get selectedActionId() {
        return this.actionId;
    }

    get prime() {
        const actor = this.document;
        const prime = actor.stats.primes.getStatById(this.primeId);
        return prime;
    }

    get action(){

        const actor = this.document;
        const action = actor.actions.getAction(this.actionId);
        return action;
    }

    get refinement() {
        const actor = this.document;
        const refinement = actor.stats.refinements.getStatById(this.refinementId);
        return refinement;
    }

    get selectedRefinementId() {
        return this.refinementId;
    }

    show({html}) {
        this.open = true;
        const view = html.view;
        this.manageDiceBar(view);
    }

    dismiss({html}) {
        const view = html.view;
        this.open = false;
        this.manageDiceBar(view);
    }

    toggleOpen({html}) {
        if(this.open) {
            this.dismiss({html});
        } else {
            this.show({html});
        }
    }

    selectActionToRoll({id, html}) {
        const {view, element} = html;
        this.open = true;
        if (this.actionId === id) {
            this.actionId = null;
        } else {
            this.actionId = id;
        }
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
    setNavActionText(view) {
        const action = this.action;
        const value = action != null ? `${action.name}` : ''
        const element = view.querySelector(".rollerBar .rollerAction .text");
        element.innerHTML = htmlToText(value);
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

    /**
     * sets all the classes and styles to the appropriate values.
     * @param view
     */
    manageDiceBar(view) {
        const tabList = view.getElementsByClassName("rollerTab");
        const tab = tabList.item(0);
        const diceBarList = view.getElementsByClassName("rollerBar");
        const diceBar = diceBarList.item(0);
        // const element = view.querySelector('.sub-nav.rollerBar');
        // this.parent.dyn.controller.rerenderPartial('actorDiceNav', view, element, this.parent);
        this.setNavPrimeValue(view);
        this.setNavRefinementValue(view);
        this.setNavPrimeText(view);
        this.setNavRefinementText(view);
        this.setNavActionText(view);
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
        removeAllCssClassesFromView(view, "selectedRollerAction");

        if(this.open){
            if(this.primeId != null){
                const primeElement = view.querySelector(`.primeWrapper[data-prime-id="${this.primeId}"]`);
                primeElement.classList.add("selectedRollerPrime");
            }
            if(this.refinementId != null) {
                const refinementElement = view.querySelector(`.refinementWrapper[data-refinement-id="${this.refinementId}"]`);
                refinementElement.classList.add("selectedRollerRefinement");
            }
            if(this.actionId != null) {
                const actionElement = view.querySelector(`.itemCardAction[data-dyn-id="${this.actionId}"]`);
                actionElement.classList.add("selectedRollerAction");
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
            const action = this.action == null ? null : this.action.name;
            const diceParams = {
                action,
                user: users[0],
                actor,
                rollMode,
                prime,
                refinement,
                total,
                modifier
            };
            this.applyAfterEffects(html)
            // must be at the end of the function, as it will commit changes mid flow,
            // and cause an external refresh meaning changes may not always apply.
            await roller.rollPrimeDice(diceParams);
        } else if(this.open) {
            this.dismiss({html});
        } else {
            this.open = true;
            const view = html.view;

            this.manageDiceBar(html.view);

        }
    }

    applyAfterEffects(html) {
        const action = this.action;
        if(action != null) {
            const ap = action.actionPoints;
            this.document.actionPoints.value = this.document.actionPoints.value - ap;
            this.parent.actionPointClicked({html});
        }
    }
}