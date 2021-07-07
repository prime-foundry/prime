import Component from "./Component.js";

export default class EmbeddedDocumentComponent extends Component {
    owningComponent;
    owningDyn;

    constructor(owningComponent, embedded) {
        super(embedded);
        this.owningComponent = owningComponent;
        this.owningDyn = this.owningComponent.dyn;
    }

    writeToContent(path, value) {
        const lastValue = super.writeToContent(path, value);
        if(lastValue !== value){
            this.updateOwnerDataManager();
        }
        return lastValue;
    }

    writeToSystem(path, value) {
        const lastValue = super.writeToSystem(path, value);
        if(lastValue !== value){
            this.updateOwnerDataManager();
        }
        return lastValue;
    }

    updateOwnerDataManager(){
        const embeddedDataManager = this.dyn.dataManager;
        this.owningDyn.dataManager.embedDirtyDataManager(embeddedDataManager);
    }
}