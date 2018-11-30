import { Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { AggregateEvent } from "./AggregateEvent";

interface DeviceProjection {
    id: string
    meta: {
        title: string
        type: string
    }
    state: {
        actual: any
        projected: {
            usage: {
                power: number
                water: number
                gas: number
            }
        }
    }
}

export interface ProjectionUpdated {
    id: string
    key: 'updated'
    payload: any
}


export const reducer = (state: DeviceProjection, event: AggregateEvent): DeviceProjection => {

    // Set the state in the projection to the reported state of the device
    if (event.key === 'state') {
        state.state.actual = event.payload
        return state
    }

    // Make a new state with this initial state
    if (event.key === 'created') {
        return {
            id: event.aggregate_id,
            meta: event.payload.meta,
            state: {
                actual: event.payload.state,
                projected: {
                    usage: {
                        power: 0,
                        water: 0,
                        gas: 0
                    }
                }
            }
        }
    }

    console.log(event)

    // Otherwise, just sum up any usage data that may be in this event
    let { usage } = state.state.projected
    let { payload } = event
    usage.power += payload.power_usage || 0
    usage.water += payload.water_usage || 0
    usage.gas += payload.gas_usage || 0
    return state
}

export const DevicesProjection = () => {

    let input$ = new Subject<any>()
    let output$ = new Subject<ProjectionUpdated>()

    let store = {}

    input$.pipe(
        
        // Filter out events for devices that we don't recognize
        filter(event => !!store[event.aggregate_id] || event.key === 'created')

    ).subscribe((event: any) => {
        let id = event.aggregate_id
        store[id] = reducer(store[id], event)
        output$.next({ id, key: 'updated', payload: store[id] })
    })

    return {
        input$,
        output$,
        list: () => Object.values(store),
        find: (id) => store[id]
    }
}
