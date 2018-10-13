import { DeviceDocument } from "./database/types";

export const reduceDeviceEvent = (document: DeviceDocument, event: AggregateEvent) => {

    if(event.key === 'state') {
        document.actual_state = event.payload
        return document
    }

    if(event.key === 'created') {
        return {
            device_id: event.aggregate_id,
            meta: event.payload.meta,
            actual_state: event.payload.state,
            projected_state: {
                power_usage: 0,
                water_usage: 0,
                gas_usage: 0
            }
        }
    }

    // Otherwise, just sum up any usage data that may be in this event
    document.projected_state.power_usage += event.payload.power_usage || 0
    document.projected_state.water_usage += event.payload.water_usage || 0
    document.projected_state.gas_usage += event.payload.gas_usage || 0
    return document
}

