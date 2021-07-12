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

    get id() {
        return this.document.id;
    }

    get sourceKey() {
        return null;
    }

    get customisable() {
        return false;
    }

    get directory() {
        return this.document;
    }

    display() {
        let documentToLoad = this.document;
        if( this.sourceKey != null && !this.customisable )
        {
            const original = this.directory.collection.get(this.sourceKey);
            if(original != null){
                documentToLoad = original;
            } else {
                console.warn(`Unable to find original document ${this.sourceKey} when looking in:`, this.directory)
            }

        }

        const sheet = documentToLoad.sheet;
        if (sheet.rendered) {
            sheet.maximize();
            sheet.bringToTop();
        } else {
            sheet.render(true);
        }
    }
}