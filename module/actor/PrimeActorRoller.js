import Component from "../util/Component.js";
import SheetComponent from "../util/SheetComponent.js";
import {PRIME_DICE_ROLLER} from "../prime_dice/prime_dice_roller.js";

export default class PrimeActorRoller extends SheetComponent {

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

    selectPrimeToRoll({id}) {
        if (this.primeId === id) {
            console.log("Prime not rolling " + id);
            this.primeId = null;
        } else {
            console.log("Prime To roll " + id);
            this.primeId = id;
        }
    }

    selectRefinementToRoll({id}) {
        if (this.refinementId === id) {
            console.log("Refinement not rolling " + id);
            this.refinementId = null;
        } else {
            console.log("Refinement To roll " + id);
            this.refinementId = id;
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