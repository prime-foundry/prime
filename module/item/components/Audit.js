import Component from "../../util/Component.js";
import {currentUser, dateAsString, userForId} from "../../util/support.js";

export default class Audit extends Component {

    constructor(parent) {
        super(parent);
        this.dyn.registerUpdateListener(this);
    }

    get created() {
        return this.audit.created;
    }

    get createdName() {
        const created = this.created;
        if (created == null) {
            return 'N/A';
        }
        const user = userForId(created.userId);
        if (user == null) {
            return created.name;
        }
        return user.name;
    }

    get createdDate() {
        const created = this.created;
        if (created == null) {
            return 'N/A';
        }
        return created.date;
    }

    get lastUpdatedName() {
        const updated = this.lastUpdated;
        if (updated == null) {
            return 'N/A';
        }
        const user = userForId(updated.userId);
        if (user == null) {
            return updated.name;
        }
        return user.name;
    }

    get lastUpdatedDate() {
        const updated = this.lastUpdated;
        if (updated == null) {
            return 'N/A';
        }
        return updated.date;
    }

    get lastUpdated() {
        const updaters = this.updates;
        return updaters.slice(-1)[0]
    }

    get updates() {
        return this.audit.updates || [];
    }

    get audit() {
        return this.gameSystem.audit || {};
    }

    get auditPath() {
        return this.gameSystemPath.with('audit');
    }

    onUpdate(userId = null) {
        const user = currentUser();
        const name = user.name;
        if (userId == null || userId === user.id) {
            const date = dateAsString();
            this.appendUpdatedAudit(name, user.id, date);
            this.setCreationAuditIfMissing(name, user.id, date);
        }
    }

    appendUpdatedAudit(name = 'system', userId = 'system', date = dateAsString()) {
        let updates = Array.from(this.updates) || [];
        updates.push({name, userId, date});
        // we do a compression here, where we keep one value for a section with repeated userids,
        // but remove dates before them, between changes, except for the last 3 changes.
        // System changes are not reduced out. (they don't have userIds)
        if (updates.length > 20) {
            updates = updates.reduce((compactedArray, currentValue, index) => {
                if (index < updates.length - 3) {
                    return compactedArray;
                }
                const compactedLength = compactedArray.length;
                if (compactedLength > 0) {
                    const previousUserId = compactedArray[compactedLength - 1].userId;
                    if (previousUserId != null && previousUserId === currentValue.userId) {
                        compactedArray[compactedLength - 1] = currentValue;
                        return compactedArray;
                    }
                }
                compactedArray.push(currentValue);
                return compactedArray;
            }, []);
        }
        this.write(this.auditPath.with('updates'), updates);
    }

    setCreationAuditIfMissing(name = 'system', userId = 'system', date = dateAsString()) {
        if (this.created == null || this.created.date.length === 0) {
            this.write(this.auditPath.with('created'), {name, userId, date});
            return true;
        }
        return false;
    }

}