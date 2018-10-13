import express from 'express'
import {Subject} from 'rxjs'
const cors = require('cors')



export const API = (DB, eventStore) => {

    let events$ = new Subject<any>()

    const app = express()
    app.use(express.json())
    app.use(cors())


    /**
     * Endpoints for Ingesting Device Data
     * ==============================================
     */
    app.post('/ingest/device-event', (req, res) => {
        events$.next(req.body)
        res.json({ msg: 'Received Telemetry'})
    })

    /**
     * Endpoints for web clients
     * ==================================
     */
    app.get('/devices', (req, res) => {
        res.json({ devices: DB.list() })
    })

    app.get('/devices/:id/events', (req, res) => {
        let {id} = req.params
        if(!eventStore.find(id)) 
            return res.status(404).send()
        res.json({ events: eventStore.find(id) })
    })

    app.post('/devices/:id/command', (req, res) => {
        let { id } = req.params
        let command = req.body
        return res.json({ id, command })
    })

    return {
        events$,
        app
    }
}