import { get as lget, set as lset } from 'lodash'
import { Subject } from 'rxjs'
import { filter, map, startWith } from 'rxjs/operators'

interface DBEvent {
    key: string
    type: string
    data: any
}

export interface IDatabase {
    insert
    update
    remove
    write
    stream
    get
}

export const Database = (): IDatabase => {

    let _state = {}
    let _stream = new Subject<DBEvent>()
    let _insert_id = 0

    let set = (path, data) => lset(_state, path, data)
    let get = (path) => lget(_state, path)

    let event = (type, key, data?): void => {
        _stream.next(({
            type,
            key,
            data: data || get(key)
        }))
    }

    
    // Whenever a node is changed, emit the updated event for all parent nodes
    let _cascadeUpdate = (changed_document_path) => {
        let keys = changed_document_path.split('.')
        keys.pop()
        while (keys.length > 0) {
            let path = keys.join('.')
            event('updated', path)
            keys.pop()
        }
    }

    // Update the value of a single node
    const update = (path, fn) => {

        // Fetch the current state (could be null)
        let oldState = get(path)

        // Apply the change
        set(path, fn(oldState))

        // added event broadcast strategy
        let broadcast_added = () => {
            let keys = path.split('.')
            keys.pop()
            let parent = keys.join('.')
            event('added', parent)
        }

        // updated event broadcast strategy
        let broadcast_updated = () => {
            event('updated', path)
            _cascadeUpdate(path)
        }

        // Broadcast the action
        // If there was no document before, use added, else use updated
        let strategy = (!oldState) ? broadcast_added : broadcast_updated
        strategy()
    }

    // Assigns a path value directly, without a reduce function
    const write = (path, data) => update(path, () => data)

    // Insert a sub-document and generates a key, returning full object path
    const insert = (parent, data) => {
        let key = `#${_insert_id++}`
        let path = [parent, key].join('.')
        write(path, data)
        return path
    }

    // Remove a single node. Removed event is emitted on parent (key removed)
    const remove = (path) => {
        let keys = path.split('.')
        let leaf = keys.pop()
        let parent_path = keys.join('.')
        let parent_doc = get(parent_path)
        delete parent_doc[leaf]
        event('removed', parent_path)
        _cascadeUpdate(parent_path)
    }

    // Stream a set of change for a node
    const stream = (path, events = ['removed', 'added', 'updated']) => {
        let eventSet = new Set(events)
        return _stream.pipe(
            startWith({ type: 'updated', key: path, data: get(path) }),
            filter(event => !!event),
            filter(event => !!event.data),
            filter(event => event.key === path && eventSet.has(event.type)),
            map(event => event.data)
        )
    }


    return {
        update,
        insert,
        write,
        remove,
        stream,
        get
    }
}