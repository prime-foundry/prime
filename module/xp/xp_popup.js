
export class XP_POPUP extends Application {
    constructor(...args) {
        super(...args);
        game.users.apps.push(this);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = game.i18n.localize("PRIME.xp.title");
        options.id = "xp";
        options.template = "systems/prime/templates/xp/xp_popup.html";
        options.closeOnSubmit = true;
        options.popOut = true;
        options.width = 600;
        options.height = "auto";
        options.classes = ["award-xp"];

        return options;
    }

    async getData() {
        // Return data to the template
        const actors = Array.from(game.actors.values())
            .filter(actor => actor.owner)
            .map(actor => {
                return {
                    id: actor.id,
                    name: actor.name,
                    img: actor.img,
                    totalXp: actor.system.xp.awarded + actor.system.xp.initial,
                    totalSoul: actor.system.soul.awarded + actor.system.soul.initial,
                };
            });
        const users = game.users.entities;

        actors;
        return {
            actors,
            users
        };
    }



    render(force, context = {}) {
        // Only re-render if needed
        const { action, data } = context;
        if (action && !["create", "update", "delete"].includes(action)) return;
        //if (action === "update" && !data.some(d => "character" in d)) return;
        if (force !== true && !action) return;
        return super.render(force, context);
    }

    doAward(event) {
        this.element.find('.xpInput')
            .each(function (index) {
                const input = $(this);
                const data = input.data();
                const val = parseInt(input.val());
                if (val > 0) {
                    const actor = game.actors.get(data.id);

                    const dataUpdate = {
                        data: {
                            xp: {
                                awarded: actor.system.xp.awarded + val
                            }
                        }
                    };
                    (async () => await actor.update(dataUpdate))();
                }
            });
        this.element.find('.soulInput')
            .each(function (index) {
                const input = $(this);
                const data = input.data();
                const val = parseInt(input.val());
                if (val > 0) {
                    const actor = game.actors.get(data.id);

                    const dataUpdate = {
                        data: {
                            soul: {
                                awarded: actor.system.soul.awarded + val
                            }
                        }
                    };
                    (async () => await actor.update(dataUpdate))();
                }
            });
			
        this.close();
    }


    activateListeners(html) {
        super.activateListeners(html);
        this.element.find(".awardXP").click((event) => this.doAward(event));

        // this.element.find(".selectPrime").click((event) => this.selectPrime(event));
        // this.element.find(".selectRefinement").click((event) => this.selectRefinement(event));
        // const actorSelect = this.element.find("#primeDiceRollerActorSelect");
        // if (actorSelect.length > 0) {
        // 	const currentSelect = this.element.find("#primeDiceRollerActorSelect option[value='" + this.currentActor.id + "']");
        // 	currentSelect.attr('selected', 'selected');
        // 	actorSelect.change((event) => this.selectActor(event));
        // }
        // this.element.find("#autoroll").click((event) => {
        // 	this.autoroll = !this.autoroll;
        // 	 $(event.delegateTarget).prop( "checked",  this.autoroll);
        // 	 event.stopPropagation();
        // });
        // this.element.find("#autoclose").click((event) => {
        // 	this.autoclose = !this.autoclose;
        // 	$(event.delegateTarget).prop( "checked",  this.autoclose);
        // 	event.stopPropagation();
        // });
    }
}