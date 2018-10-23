import axios from 'axios';
import { API } from './api';
import { Collection } from './database/collection';
import { DocumentChangeEvent } from './database/types';
import { reduceDeviceEvent } from './reduce';

// Setup simple state management strategy
let DB = Collection('projections')
let eventStore = Collection('events')


// Whenever our projection changes, publish an event to Node-Red
DB.changes$.subscribe((change: DocumentChangeEvent) => {
    let changeEndpoint = 'http://localhost:1880/projection-changes'
    axios.post(changeEndpoint, change)
        .then(() => null).catch(console.error.bind(null, "Could not publish change event"))
})


// Launch an HTTP API to consume inbound Aggregate Events
let httpServer = API(DB, eventStore)
httpServer.events$.subscribe((event: AggregateEvent) => {

    // ignore events (except created) for devices we have not yet created
    if(!DB.find(event.aggregate_id) && event.key !== 'created') 
        return

    // Update the projection
    DB.update(event.aggregate_id, document => reduceDeviceEvent(document, event))

    // Source Event
    eventStore.update(event.aggregate_id, document => {
        let d = document || []
        d.push(event)
        return d
    })
})

// Start the server process
httpServer.app.listen(7000)