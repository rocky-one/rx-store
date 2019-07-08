import { Subject } from "rxjs"
import storeHOC from './storeHOC'

class StoreFactory {
    // state$,
    constructor(option) {
        this.name = option.name;
        this.state = option.state || {};
        // this.state$ = state$;
        this.reducers = option.reducers;
        this.effects = option.effects;
        this.subject = new Subject();
    }
    
    getObservable =() =>{
        return this.subject
    } 
    runReducer = action => {
        const reducer = this.reducers[action.type]
        if (reducer && typeof reducer === 'function') {
            this.state = reducer(action, this.state);
            if (!action.suspens) {
                // this.state$.next(this.state);
                this.subject.next(this.state)
            }
        } else {
            throw new Error('effects[action.type] not a function')
        }
    };
    runEffect = action => {
        const effect = this.effects[action.type]
        if (effect && typeof effect === 'function') {
            return effect(action, this.state)
        } else {
            throw new Error('effects[action.type] not a function')
        }
    };
}

class modelMap {
    constructor() {
        this.modelMap = {}
        this.storeRoot = {}
        this.storeRoot$ = {}
    }
    add = (modelName, store, store$) => {
        // if (this.modelMap[modelName]) {
        //   throw "Template name already exists";
        // }
        this.storeRoot[modelName] = store.state
        this.storeRoot$[modelName] = store$
        this.modelMap[modelName] = store;
    }
    remove = modelName => {
        if (this.modelMap[modelName]) {
            this.modelMap[modelName] = null;
            delete this.modelMap[modelName];
            return true
        }
        return false
    }
    getModelMap = () => {
        return this.modelMap;
    }
    getModelState = modelName => {
        if (this.modelMap[modelName]) {
            return this.modelMap[modelName].state;
        }
        return null;
    }
    getModelState$ = modelName => {
        if (this.storeRoot$[modelName]) {
            return this.storeRoot$[modelName];
        }
        return null;
    }
    getStoreRoot = () => {
        return this.storeRoot
    }
}

export const mIns = new modelMap();

export const createStore = model => {
    // const state$ = new BehaviorSubject(model.state);
    // state$, 
    const store = new StoreFactory(model);
    mIns.add(model.name, store, store.getObservable());
    return {
        state$: store.getObservable(),
        effects: store.effects
    };
};

export const removeStore = modelName => {
    return mIns.remove(modelName);
};

export const dispatch = (action) => {
    if (action.payload.hasOwnProperty("data")) {
        mIns.modelMap[action.name]["runReducer"](action)
    } else {
        const res = mIns.modelMap[action.name]["runEffect"](action)
        if (res) {
            return res
        }
    }
}

export const getStore = (storeName) => {
    return mIns.getModelState(storeName);
}

export const inject = (mapStateToProps, option) => Com => storeHOC(Com, mapStateToProps, option)
