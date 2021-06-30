import Component from "./Component.js";

export default class EmbeddedDocumentComponent extends Component {
    owningComponent;
    owningDocument;
    constructor(owningComponent, embedded) {
        super(embedded);
        this.owningComponent = owningComponent;
        this.owningDocument = owningComponent instanceof Component ? owningComponent.document : owningComponent;;
    }


    writeToContent(path, value) {
        const lastValue = super.writeToContent(path, value);
        if(lastValue != value){
        }
        return lastValue;
    }

    writeToSystem(path, value) {
        const lastValue = super.writeToSystem(path, value);
        if(lastValue != value){
            this.updateOwnerDataManager();
        }
        return lastValue;
    }

    updateOwnerDataManager(){
        const embeddedDataManager = this.document.dataManager;
        this.owningDocument.dataManager.embedDirtyDataManager(embeddedDataManager);
    }
}