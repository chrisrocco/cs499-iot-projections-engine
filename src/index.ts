import axios from 'axios';
import { tap } from 'rxjs/operators';
import { API } from './api';
import { Database } from './core/Database';
import { DevicesProjection, ProjectionUpdated } from './DevicesProjection';

require('dotenv').config()
const {env} = process

// Setup simple state management strategy
let eventStore = Database()


// Init home projection
let deviceProjection = DevicesProjection()


// Whenever our projection changes, publish an event to Node-Red
deviceProjection.output$.subscribe((change: ProjectionUpdated) => {
    let changeEndpoint = `${env.NODE_RED}/projection-changes`
    axios.post(changeEndpoint, change)
        .then(() => null).catch(console.error.bind(null, "Could not publish change event"))
})


// Launch an HTTP API to consume inbound Aggregate Events
let httpServer = API(deviceProjection, eventStore)
httpServer
    .deviceEvents$
    .pipe(
        // pipe into device projections modules
        tap(event => deviceProjection.input$.next(event)),

        // save the event in database
        tap(event => {
            let id = event.aggregate_id
            eventStore.insert(`aggregates.${id}.events`, event)
        })
    )
    .subscribe()

// Start the server process
httpServer.app.listen(process.env.PORT || 7000)