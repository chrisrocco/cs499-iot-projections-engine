import {DevicesProjection} from '../src/DevicesProjection'

test('device projection', () => {
    
    let proj = DevicesProjection()

    proj.input$.next({
        key: 'created',
        aggregate_id: '1234',
        payload: {
            meta: {
                title: 'Test Device',
                type: '---'
            },
            state: {}
        }
    })

    proj.input$.next({
        key: 'state',
        aggregate_id: '1234',
        payload: { on: true }
    })

    let document = proj.find('1234')
    expect(document.state.actual.on).toBe(true)
})