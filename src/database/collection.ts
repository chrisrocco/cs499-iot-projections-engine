import { Subject } from "rxjs";
import { DocumentChangeEvent } from "./types";

let copy = obj => JSON.parse(JSON.stringify(obj))


export const Collection = (name = '') => {

    // Persistence strategy
    let state = {}
    let changes$ = new Subject<DocumentChangeEvent>()


    // Controller functions
    let update = (id, map) => {
        state[id] = map(state[id])
        changes$.next({ id, key: 'updated', document: copy(state[id]) })
    }

    let create = (id, document) => {
        document.id = id
        state[id] = document
        changes$.next({ id, key: 'created', document })
    }

    let remove = (id) => {
        delete state[id]
        changes$.next({ id, key: 'deleted' })
    }

    let list = () => copy(Object.values(state))

    let find = (id) => {
        if(!state[id]) return
        return copy(state[id])
    }

    return {
        name,
        changes$,
        update,
        create,
        find,
        list
    }

}