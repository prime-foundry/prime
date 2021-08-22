import Component from "../../util/Component.js";
import {minmax} from "../../util/support.js";
import {pathProperty} from "../../util/dyn_helpers.js";

export default class Armour extends Component {
    constructor(parent) {
        super(parent);


        const armourPath = this.gameSystemPath.with('armour');
        pathProperty(this, 'type', armourPath);
        pathProperty(this, 'protection', armourPath,
            {onSet: (protection) => minmax(0, protection, 5)});
        pathProperty(this, 'resilience', armourPath,
            {onSet: (resilience) => minmax(0, resilience, 5)});
        pathProperty(this, 'keywords', armourPath,
            {onGet: (keywords) => keywords || []});
        pathProperty(this, 'untrainedPenalties', armourPath,
            {onGet: (untrainedPenalties) => untrainedPenalties || []});
    }

    set toggleKeyword(keyword) {
        const keywords = this.keywords;
        const index = keywords.indexOf(keyword);
        if (index < 0) {
            keywords.push(keyword);
            keywords.sort();
        } else {
            keywords.splice(index, 1);
        }
        this.keywords = Array.from(keywords);
    }

    set toggleUntrainedPenalty(untrainedPenalty) {
        const untrainedPenalties = this.untrainedPenalties;
        const index = untrainedPenalties.indexOf(untrainedPenalty);
        if (index < 0) {
            untrainedPenalties.push(untrainedPenalty);
            untrainedPenalties.sort();
        } else {
            untrainedPenalties.splice(index, 1);
        }
        this.untrainedPenalties = Array.from(untrainedPenalties);
    }
}