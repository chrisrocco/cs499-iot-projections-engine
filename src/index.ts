import axios from 'axios';
import { API } from './api';
import { Collection } from './database/collection';
import { DocumentChangeEvent } from './database/types';
import { reduceDeviceEvent } from './reduce';


let DB = Collection('projections')
let eventStore = Collection('events')

DB.changes$.subscribe((change: DocumentChangeEvent) => {
    // publish changes to some endpoint
    let changeEndpoint = 'http://localhost:1880/projection-changes'
    axios.post(changeEndpoint, change)
        .then(() => null).catch(console.error.bind(null, "Could not publish change event"))
})


let httpServer = API(DB, eventStore)
httpServer.events$.subscribe((event: AggregateEvent) => {
    console.log(event)
    // Update Projections
    if(!DB.find(event.aggregate_id) && event.key !== 'created') 
        return // ignore events (except created) for devices we have not yet created
    DB.update(event.aggregate_id, document => reduceDeviceEvent(document, event))
    // Source Event
    eventStore.update(event.aggregate_id, document => {
        let d = document || []
        d.push(event)
        return d
    })
})
httpServer.app.listen(7000)