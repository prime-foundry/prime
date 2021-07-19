import Component from "../../util/Component.js";
import {currentUser, dateAsString, userForId} from "../../util/support.js";

export default class Metadata extends Component {

    constructor(parent) {
        super(parent);
        this.dyn.registerUpdateListener(this);
    }

    get created(){
        return this.metadata.created;
    }

    get createdName(){
        const created = this.created;
        if(created == null){
            return 'N/A';
        }
        const user = userForId(created.userId);
        if(user == null){
            return created.name;
        }
        return user.name;
    }

    get createdDate(){
        const created = this.created;
        if(created == null){
            return 'N/A';
        }
        return created.date;
    }

    get lastUpdatedName(){
        const updated = this.lastUpdated;
        if(updated == null){
            return 'N/A';
        }
        const user = userForId(updated.userId);
        if(user == null){
            return updated.name;
        }
        return user.name;
    }

    get lastUpdatedDate(){
        const updated = this.lastUpdated;
        if(updated == null){
            return 'N/A';
        }
        return updated.date;
    }
    get lastUpdated(){
        const updaters = this.updates;
        return (updaters || []).slice(-1)[0]
    }

    get updates() {
        return this.metadata.updates;
    }

    get metadata() {
        return this.system.metadata || {};
    }

    onUpdate(){
        const user = currentUser();
        const date = dateAsString();
        const name = user.name;
        const userId = user.id;

        const update = {name, userId, date};

        let updates = Array.from(this.updates) || [];

        updates.push(update);
        // 20 is a magic number, yes it is.
        // maybe do a compression here, where we keep unique userids, between changes.
        if(updates.length > 20){
            updates = updates.slice(-20);
        }

        this.write(this.pathToGameSystemData('metadata', 'updates'), updates);
        if(this.created == null){
            this.write(this.pathToGameSystemData('metadata', 'created'), updates);
        }
    }

}