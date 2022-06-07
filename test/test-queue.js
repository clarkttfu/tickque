const test = require('tape')
const Queue = require('../index')

test('Constructor', t => {
  t.test ('default constructor', st => {
    var q = new Queue()
    st.equal(q._interval, 1, 'q._interval')
    st.equal(q._limit, 0, 'q._limit')
    st.equal(q._timer, undefined, 'q._timer')
    st.equal(q._callbacks.size, 0, 'q._callbacks.size')
    st.equal(q.length, 0, 'q.length')
    st.end()
  })

  t.test('construct with params', st => {
    var q = new Queue(7, 2)
    st.equal(q._interval, 7)
    st.equal(q._limit, 2)
    st.equal(q._timer, undefined)
    st.equal(q._callbacks.size, 0)
    st.equal(q.length, 0)
    st.end()
  })
})


test('Test TickQueue methods', t => {

  t.test('onShift avoid duplicate and invalid callbacks', st => {
    var q = new Queue()
    var noop = () => {}
    q.onShift({})
    q.onShift(noop)
    q.onShift(noop)
    st.equal(q._callbacks.size, 1, 'q._callbacks.size')
    st.equal(q.length, 0, 'q.length')
    st.end()
  })

  t.test('add nothing if item is undefined', st => {
    var q = new Queue()
    st.notOk(q.add(), 'q.add()')
    st.notOk(q.add(undefined, 1), 'q.add(undefined, 1)')
    st.equal(q.length, 0, 'q.length')
    st.end()
  })

  t.test('add nothing if ttl <= 0', st => {
    var q = new Queue()
    st.notOk(q.add(null, 0), 'q.add(null, 0)')
    st.notOk(q.add(null, -1), 'q.add(null, -1)')
    st.equal(q.length, 0, 'q.length')
    st.end()
  })

  t.test('add nothing if ttl > limit', st => {
    var q = new Queue(1, 2)
    st.notOk(q.add(null, 3))
    st.equal(q.length, 0, 'q.length')
    st.end()
  })

  t.test('add to the end of queue, without growing', st => {
    var q = new Queue()
    var i = 0
    while (i < 1000) {
      st.ok(q.add(++i))
      st.equal(q.length, 1, 'q.length == 1')
      st.equal(q.count(), i, 'q.count == i')
    }
    q.stop()
    st.end()
  })

  t.test('add to the end of limited queue', st => {
    var q = new Queue(1, 5)
    var i = 0
    while (i < 20) {
      st.ok(q.add(++i))
      st.equal(q.length, 5)
      st.equal(new Set(q.peek(5)).size, i)
      st.equal(q.count(), i)
    }
    q.stop()
    st.end()
  })

  t.test('add and grow dynamically', st => {
    var q = new Queue()
    var i = 0
    while (i < 1000) {
      st.ok(q.add(++i, i))
      st.equal(q.length, i)
      st.equal(q.count(), i)
    }
    q.stop()
    st.end()
  })

  t.test('add with new ttl', st => {
    var q = new Queue()
    q.add(1, 2)
    st.notOk(q._queue.peekAt(0).has(1))
    st.ok(q._queue.peekAt(1).has(1))
    q.add(1) // to the end of queue: ttl=2
    st.notOk(q._queue.peekAt(0).has(1))
    st.ok(q._queue.peekAt(1).has(1))
    q.add(1, 1)
    st.ok(q._queue.peekAt(0).has(1))
    st.notOk(q._queue.peekAt(1).has(1))
    st.equal(q.peek(3), undefined)
    q.stop()
    st.end()
  })

  t.test('add and grow with limit', st => {
    var q = new Queue(1, 2)
    st.equal(q.length, 0)
    st.ok(q.add(null, 1))
    st.equal(q.length, 1)
    st.equal(q.count(), 1)
    st.ok(q.add(null, 2))
    st.equal(q.length, 2)
    st.equal(q.count(), 1)
    st.notOk(q.add(null, 3))
    st.equal(q.length, 2)
    st.equal(q.count(), 1)
    q.stop()
    st.end()
  })

  t.test('remove returns boolean', st => {
    var q = new Queue()
    st.ok(q.add(null))
    st.ok(q.remove(null))
    st.notOk(q.remove(null))
    st.equal(q.length, 1)
    st.equal(q.count(), 0)
    st.ok(q.add(null, 3))
    st.equal(q.count(), 1)
    st.ok(q.remove(null))
    st.equal(q.length, 3)
    st.equal(q.count(), 0)
    q.stop()
    st.end()
  })

  t.test('remove to auto stop', st => {
    var q = new Queue()
    st.ok(q.add(1))
    st.ok(q.add(2))
    st.ok(q._timer)
    st.ok(q.remove(2))
    st.ok(q.remove(1))
    st.equal(q._timer, undefined)
    st.end()
  })
})
