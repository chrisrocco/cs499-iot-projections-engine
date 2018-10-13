export interface DeviceDocument {
    device_id: string
    meta: any
    actual_state: any
    projected_state: {
        power_usage: number
        water_usage: number
        gas_usage: number
    }
}

export interface DocumentChangeEvent {
    key: 'updated' | 'created' | 'deleted'
    id: string
    document?: DeviceDocument
}