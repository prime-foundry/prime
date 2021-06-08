/**
 * An ActorComponent is just a proxy for an existing data store.
 * It doesn't store any real data, just the references to the data store,
 * however it should contain all the modification and utility functions, you might need.
 * Think of it as a cross between an Entity class and a Repository class in Domain Driven Design, (which is a bit like an Object Orientated DAO, or an ORM)
 *
 * This allows us to have clean separation of logical model and physical data store, the data store being a horrible mess.
 * It should also make migration between versions a bit more manageable.
 *
 * @example <caption>I want to get the maximum of the the psyche</caption>
 * this.actor.stats.health.psyche.max
 * @example <caption>I want to get the current value.</caption>
 * this.actor.stats.health.psyche.value
 * @example <caption>I want to set the current value.</caption>
 * this.actor.stats.health.psyche.value = 5
 * @example <caption>or, there is a shortcut.</caption>
 * this.actor.stats.health.psyche = 5
 */
export default class ActorComponent {

    constructor(parent) {
        const isRoot = !(parent instanceof ActorComponent);
        this.__isRoot = isRoot;
        this.__actor = isRoot ? parent : parent._actor;
        this.__root = isRoot ? this : parent._root;
    }

    get _root(){
        return this.__root;
    }

    get _dataProvider() {
        return this._root.__dataProvider;
    }

    get _isRoot() {
        return this.__isRoot;
    }

    get _actor() {
        return this.__actor;
    }

    set _dataProvider(dataProvider) {
        if(this._isRoot){
            this.__dataProvider = dataProvider;
        } else {
            this._root._dataProvider = dataProvider;
        }
    }


    isCharacter(){
        return this._actorData.type === 'character';
    }
    /**
     * We need one single data object between these changes.
     */
    get _actorData() {
        if(this._isRoot){
            if (this.__actorData == null) {
                if (this.__dataProvider == null) {
                    this.__actorData = this.__actor.data;
                } else {
                    this.__actorData = this.__dataProvider.data;;
                }
            }
            return this.__actorData;
        } else {
            return this._root._actorData;
        }
    }

    /**
     * @return {User}
     * @protected
     */
    get _user(){
       return this._calculateValueOnce('user', ()=>Array.from(game.users.values()).find(user => user.isSelf));
    }

    get _actorSystemData() {
        return this._actorData.data;
    }

    _update() {
        const dataProvider = this._dataProvider;
        if(dataProvider == null){
            this._actor.markedDirty = true;
        } else {
            this._dataProvider.markedDirty = true;
        }
    }

    /**
     * Lazily loads an ActorComponent on request. This keeps our object model small, as we only generate instances we need.
     * We use the property descriptors of Object to keep the fields private.
     * @example <caption>equivalent to the following: when provided a *name* and a *Type* </caption
     * if(!this._name) {
     *     return this.__name = new Type(this);
     * }
     * return this.name;
     *
     * @param {string} name the fieldName
     * @param {Class.<ActorComponent>} Type the class we want to instantiate
     * @return {Class.<Type>} the actor component we generate
     * @protected
     */
    _getComponentLazily(name, Type) {
        const fieldName = `__${name}`;
        const property = Object.getOwnPropertyDescriptor(this, fieldName);
        if(property == null){
            const value = new Type(this);
            Object.defineProperty(this, fieldName, {value});
            return value;
        }
        return property.value;
    }

    /**
     * calculates a value once. This prevents calculating values more than once a request.
     * Specifically we may have some expensive calculations iterating
     * through loads of items, and we want to reduce that load.
     *
     * We use the property descriptors of Object to keep the fields private.
     * if a thisArg is provided then the *this* scope will be of the thisArg otherwise it defaults to the calling actor component.
     * You can also provide an array of arguments you want to send to the function.
     * @example <caption>equivalent to the following: when provided a *name* and a *func* </caption
     * if(!this._name) {
     *     return this.__name = func();
     * }
     * return this.name;
     * @example <caption> call a function with arguments </caption>
     * const value = this._calculateValueOnce('myName', (a,b) => a+b, this, 3,5);
     * // returns 8
     * @param {string} name the fieldName
     * @param {function} func the class we want to instantiate
     * @param {*} (thisArg=this) the scope we execute in.
     * @param {*} (rest) the rest of the arguments for the function.
     * @return {any}
     * @protected
     */
    _calculateValueOnce(name, func, thisArg = this, ...rest) {
        const fieldName = `__${name}`;
        const property = Object.getOwnPropertyDescriptor(this, fieldName);
        if(property == null){
            const value = (!!rest && rest.length > 0) ? func.call(thisArg,...rest): func.call(thisArg);
            Object.defineProperty(this, fieldName, {value});
            return value;
        }
        return property.value;
    }
}