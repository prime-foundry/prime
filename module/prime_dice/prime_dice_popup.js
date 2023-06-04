import {PRIME_DICE_ROLLER} from "./prime_dice_roller.js";

export class PRIME_DICE_POPUP extends Application
{


    constructor(data)
    {
        super(data);
        game.users.apps.push(this);
        this.diceRoller = new PRIME_DICE_ROLLER();
        this.currentActor = null;
        this.sortedStats = {};
        this.selectedPrime = null;
        this.selectedRefinement = null;
        this.selectedPrimeValue = 0;
        this.selectedRefinementValue = 0;
        this.doublePrime = false;
        this.autoroll = false;
        this.autoclose = false;
        this.controlTokenHookId = Hooks.on("controlToken", this.selectTokenFn());
    }

    static get defaultOptions()
    {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("PRIME.diceRoller.title");
        options.id = "primeDiceRoller";
        options.template = "systems/prime/templates/dice/roller.html";
        options.closeOnSubmit = true;
        options.popOut = true;
        options.width = 600;
        options.height = "auto";
        options.classes = ["prime-dice"];

        return options;
    }

    selectTokenFn()
    {
        let self = this;
        return function (...args)
        {
            self.selectToken(...args);
        };
    }

    selectToken(token)
    {
        if (token.actor)
        {
            this.selectActor(token.actor);
        }
    }

    async getData()
    {
        // Return data to the template
        const actors = Array.from(game.actors.values())
            // .filter(actor => actor.ownership.default !== 0)
            .sort(function (actor1, actor2)
            {
                if (actor1.isNPC() ^ actor2.isNPC())
                {
                    if (actor1.isNPC())
                    {
                        return 1;
                    }
                    else
                    {
                        return -1;
                    }
                }
                else if (actor1.hasPlayerOwner ^ actor2.hasPlayerOwner)
                {
                    if (actor1.hasPlayerOwner)
                    {
                        return -1;
                    }
                    else
                    {
                        return 1;
                    }
                }
                else
                {
                    return actor1.name.localeCompare(actor2.name);
                }
            });
        const users = game.users.entities;

        if (!this.currentActor)
        {
            this.currentActor = actors[0];
        }
        const primes = this.getPrimes();
        const refinements = this.getRefinements();

        this.sortedStats = this.currentActor.getTypeSortedPrimesAndRefinements();
        return {
            actors,
            users,
            primes,
            refinements,
            sortedStats: this.sortedStats,
            currentActor: this.currentActor,
            autoroll: this.autoroll,
            autoclose: this.autoclose
        };
    }

    getPrimes()
    {
        const primeData = this.currentActor.getPrimes();
        if (primeData)
        {
            let primes = [];
            let currPrime = null;
            for (let currAbbrevation in primeData)
            {
                currPrime = primeData[currAbbrevation];
                primes.push({name: currAbbrevation, title: game.i18n.localize(currPrime.title)});
            }
            return primes;
        }
        console.error("Unable to find Primes data.");
        return [];
    }

    getRefinements()
    {
        const refinementData = this.currentActor.getRefinements();
        if (refinementData)
        {
            var localisedRefinments = this.getLocalisedRefinments(refinementData);
            var catergorisedRefinementsList = [];

            for (var _currType in localisedRefinments)
            {
                catergorisedRefinementsList.push({
                    name: "null",
                    title: game.i18n.localize("PRIME.refinment_type_" + _currType)
                });

                catergorisedRefinementsList = catergorisedRefinementsList.concat(localisedRefinments[_currType]);
            }

            return catergorisedRefinementsList;
        }
        console.error("Unable to find Refinements data.");
        return [];
    }

    getLocalisedRefinments(refinementData)
    {
        let refinementGroups = {};
        let currGroupType = "";
        let currRefinement = null;
        for (let key in refinementData)
        {
            currRefinement = refinementData[key];
            currGroupType = currRefinement.type;

            if (!refinementGroups[currGroupType])
            {
                refinementGroups[currGroupType] = [];
            }

            refinementGroups[currGroupType].push(
                {
                    name: key,
                    title: "&nbsp;&nbsp;" + game.i18n.localize(currRefinement.title)
                });

            refinementGroups[currGroupType].sort();
        }
        return refinementGroups;
    }

    render(force, context = {})
    {
        // Only re-render if needed
        const {action} = context;
        if (action && !["create", "update", "delete"].includes(action)) return;
        //if (action === "update" && !data.some(d => "character" in d)) return;
        if (force !== true && !action) return;
        return super.render(force, context);
    }

    selectPrime(event)
    {
        const primeDataKey = "data-prime-key";
        const primeDataValue = "data-prime-value";

        const thisElement = $(event.delegateTarget);
        const thisKey = thisElement.attr(primeDataKey);

        if (this.selectedPrime == thisKey)
        {

            if (this.doubled)
            {
                this.selectedPrime = null;
                this.doubled = false;
                this.selectedPrimeValue = 0;
            }
            else
            {
                this.doubled = true;

                this.selectedRefinement = null;
                this.selectedRefinementValue = 0;

            }
        }
        else
        {
            this.selectedPrime = thisKey;
            this.selectedPrimeValue = Number.parseInt(thisElement.attr(primeDataValue), 10);
        }

        this.updateSelectionView(event);
        this.updateRoll(event);
    }


    selectRefinement(event)
    {
        const refinementDataKey = "data-refinement-key";
        const refinementDataValue = "data-refinement-value";
        const refinementDataDefault = "data-refinement-default-prime";
        const primeDataKey = "data-prime-key";

        const primeDataValue = "data-prime-value";

        const thisElement = $(event.delegateTarget);
        const thisKey = thisElement.attr(refinementDataKey);


        if (this.selectedRefinement == thisKey)
        {
            this.selectedRefinement = null;
            this.selectedRefinementValue = 0;
        }
        else
        {

            if (this.selectedPrime)
            {
                if (this.doubled)
                {
                    this.doubled = false;
                }
            }
            else
            {
                const defaultPrime = thisElement.attr(refinementDataDefault);
                if (defaultPrime)
                {
                    this.selectedPrime = defaultPrime;

                    const primeElement = this.element.find(".selectPrime[" + primeDataKey + "=\"" + this.selectedPrime + "\"]");
                    this.selectedPrimeValue = Number.parseInt(primeElement.attr(primeDataValue), 10);
                }
            }
            this.selectedRefinement = thisKey;
            this.selectedRefinementValue = Number.parseInt(thisElement.attr(refinementDataValue), 10);

        }
        this.updateSelectionView(event);
        this.updateRoll(event);
    }

    updateSelectionView(event)
    {

        const selectedRefinementClass = "selectedRefinement";
        const refinementDataKey = "data-refinement-key";

        const selectedPrimeClass = "selectedPrime";
        const primeDataKey = "data-prime-key";
        const doubledSelectedClass = "doubled";

        this.element.find("." + selectedRefinementClass).removeClass(selectedRefinementClass);
        this.element.find("." + selectedPrimeClass).removeClass(selectedPrimeClass);
        this.element.find("." + doubledSelectedClass).removeClass(doubledSelectedClass);

        if (this.selectedPrime)
        {

            const primeElement = this.element.find(".selectPrime[" + primeDataKey + "=\"" + this.selectedPrime + "\"]");
            primeElement.addClass(selectedPrimeClass);
            if (this.doubled)
            {
                primeElement.addClass(doubledSelectedClass);
            }
        }
        if (this.selectedRefinement)
        {
            const refinementElement = this.element.find(".selectRefinement[" + refinementDataKey + "=\"" + this.selectedRefinement + "\"]");
            refinementElement.addClass(selectedRefinementClass);
        }
    }

    updateRoll(event)
    {

        const primeData = game.system.template.Actor.templates.primes_template.primes;
        const refinementData = game.system.template.Actor.templates.refinements_template.refinements;

        const rollButton = this.element.find(".rollPrimeDice");
        if (this.selectedPrime)
        {
            const localizedPrime = game.i18n.localize(primeData[this.selectedPrime].title);
            if (this.doubled)
            {
                rollButton.text("Roll " + localizedPrime
                    + " twice. (" + this.selectedPrimeValue + " + " + this.selectedPrimeValue + " + ?)");

                if (this.autoroll)
                {
                    this.doAutoRoll();
                }
            }
            else if (this.selectedRefinement)
            {
                const localizedRefinement = game.i18n.localize(refinementData[this.selectedRefinement].title);

                rollButton.text("Roll " + localizedPrime + " with " + localizedRefinement
                    + ". (" + this.selectedPrimeValue + " + " + this.selectedRefinementValue + " + ?)");

                if (this.autoroll)
                {
                    this.doAutoRoll();
                }
            }
            else
            {
                rollButton.text("Roll " + localizedPrime + " once. (" + this.selectedPrimeValue + " + ?)");
            }
        }
        else if (this.selectedRefinement)
        {
            const localizedRefinement = game.i18n.localize(refinementData[this.selectedRefinement].title);
            rollButton.text("Roll " + localizedRefinement + " once. (" + this.selectedRefinementValue + " + ?)");
        }
        else
        {
            rollButton.text("Roll!");
        }

    }

    doAutoRoll()
    {
        this.doRoll();
        this.selectedPrime = null;
        this.selectedRefinement = null;
        this.selectedPrimeValue = 0;
        this.selectedRefinementValue = 0;
        this.doubled = false;

        const selectedRefinementClass = "selectedRefinement";
        const selectedPrimeClass = "selectedPrime";
        const doubledSelectedClass = "doubled";

        this.element.find("." + selectedRefinementClass).removeClass(selectedRefinementClass);
        this.element.find("." + selectedPrimeClass).removeClass(selectedPrimeClass);
        this.element.find("." + doubledSelectedClass).removeClass(doubledSelectedClass);
        this.element.find(".rollPrimeDice").text("Roll!");
    }

    doRoll()
    {
        const users = Array.from(game.users.values()).filter(user => user.isSelf);
        const rollModeField = this.element.find("select[name=\"primeDiceRollMode\"] option:selected");
        const rollMode = rollModeField.val() || "roll";
        var diceParams = {
            "user": users[0],
            "actor": this.currentActor,
            "rollMode": rollMode
        };
        var total = 0;
        if (this.selectedPrime)
        {
            diceParams["prime"] = {
                key: this.selectedPrime,
                value: this.selectedPrimeValue,
                doubled: this.doubled
            };
            total += this.selectedPrimeValue;
            if (this.doubled)
            {
                total += this.selectedPrimeValue;
            }
        }
        if (this.selectedRefinement)
        {
            diceParams["refinement"] = {
                key: this.selectedRefinement,
                value: this.selectedRefinementValue,
            };
            total += this.selectedRefinementValue;
        }

        const raw = parseInt(this.element.find("#raw-modifier").val());
        if (raw != 0)
        {
            diceParams["modifier"] = raw;
            total += raw;
        }
        diceParams["total"] = total;
        this.diceRoller.rollPrimeDice(diceParams);
        console.log("rolled", diceParams);

        if (this.autoclose)
        {
            this.close();
        }
    }


    selectActor(newActor)
    {
        if (newActor.ownership && this.currentActor.id != newActor.id)
        {
            this.currentActor = newActor;
            this.sortedStats = this.currentActor.getTypeSortedPrimesAndRefinements();
            this.selectedPrimeValue = 0;
            this.selectedRefinementValue = 0;
            this.selectedPrime = null;
            this.selectedRefinement = null;
            this.doubled = false;
            this.render(false, {action: "update"});
        }
    }

    activateListeners(html)
    {
        super.activateListeners(html);
        this.element.find(".rollPrimeDice").click((event) => this.doRoll(event));
        this.element.find(".selectPrime").click((event) => this.selectPrime(event));
        this.element.find(".selectRefinement").click((event) => this.selectRefinement(event));
        const actorSelect = this.element.find("#primeDiceRollerActorSelect");
        if (actorSelect.length > 0)
        {
            const currentSelect = this.element.find("#primeDiceRollerActorSelect option[value='" + this.currentActor.id + "']");
            currentSelect.attr("selected", "selected");
            actorSelect.change((event) =>
            {
                const newActor = game.actors.get(event.target.value);
                this.selectActor(newActor);
            });
        }
        this.element.find("#autoroll").click((event) =>
        {
            this.autoroll = !this.autoroll;
            $(event.delegateTarget).prop("checked", this.autoroll);
            event.stopPropagation();
        });
        this.element.find("#autoclose").click((event) =>
        {
            this.autoclose = !this.autoclose;
            $(event.delegateTarget).prop("checked", this.autoclose);
            event.stopPropagation();
        });
        this.activateIncrementButtons(html);
    }

    activateIncrementButtons(html)
    {
        this.element.find(".number-field")
            .each(function (index)
            {
                const input = $(this).find(".number-input");
                const increment = $(this).find(".number-button.increment");
                const decrement = $(this).find(".number-button.decrement");
                increment.click((event) =>
                {
                    const val = parseInt(input.val()) + 1;
                    var max = $(input).attr("max");

                    // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
                    if (typeof max !== typeof undefined && max !== false)
                    {
                        // Element has this attribute
                        if (val <= parseInt(max))
                        {
                            input.val(val);
                        }
                    }
                    else
                    {
                        input.val(val);
                    }
                });
                decrement.click((event) =>
                {
                    const val = parseInt(input.val()) - 1;
                    var min = $(input).attr("min");

                    // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
                    if (typeof min !== typeof undefined && min !== false)
                    {
                        // Element has this attribute
                        if (val >= parseInt(min))
                        {
                            input.val(val);
                        }
                    }
                    else
                    {
                        input.val(val);
                    }
                });

            });
    }
}