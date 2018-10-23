import express from 'express'
import {Subject} from 'rxjs'
import { IDatabase } from './core/Database';
const cors = require('cors')



export const API = (DB, eventStore: IDatabase) => {

    // module event stream
    let deviceEvents$ = new Subject<any>()

    // init the express app and global middleware
    const app = express()
    app.use(express.json())
    app.use(cors())


    /**
     * Endpoints for ingesting device events
     * ==============================================
     */

    // consumes a device event
    app.post('/ingest/device-event', (req, res) => {
        deviceEvents$.next(req.body)
        res.json({ msg: 'Received Telemetry'})
    })


    /**
     * Endpoints for web clients
     * ==================================
     */

    // returns a list of all devices
    app.get('/devices', (req, res) => {
        res.json({ devices: DB.list() })
    })

    // returns a list of events applied to an aggregate
    app.get('/devices/:id/events', (req, res) => {
        let {id} = req.params
        if(!eventStore.get(id)) 
            return res.status(404).send()
        res.json({ 
            events: Object.values(eventStore.get(`aggregates.${id}.events`))
        })
    })


    // Module exports
    return {
        deviceEvents$,
        app
    }
}