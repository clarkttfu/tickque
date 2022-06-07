const test = require('tape')
const Queue = require('../index')

test('tick and shift of length 1', t => {
  var q = new Queue(0, 1, true)
  var cb = iter => {
    var i = 0
    for (let it of iter) {
      t.equal(it, ++i)
    }
    t.equal(q.length, 0)
    t.equal(q.count(), 0)
    t.equal(i, 3)
    t.end()
  }
  q.onShift(cb)
  q._queue.peekAt(0).add(1)
  q._queue.peekAt(0).add(2)
  q._queue.peekAt(0).add(3)
  q.start(true) // tick immediately, length--
})

test('auto stop once queue is empty', t => {
  let callback = null
  var q = new Queue(0.01).onShift(v => (callback = v.next().value))
  q.add('foo')
  setTimeout(() => {
    q.remove('foo')
    t.equal(q.count(), 0)
    t.equal(callback, 'foo')
    t.equal(q._timer, undefined)
    t.end()
  }, 50)
})

test('will not stop if queue is not empty', t => {
  let count = 0
  var q = new Queue(0.01, 3).onShift(v => {
    t.equal(v.next().value, ++count)
    t.ok(v.next().done)
    if (count >= 2) {
      t.end()
    }
  })
  q.add(1, 2)
  q.add(2, 3)
})

test('manual tick before timer', t => {
  t.plan(7)
  var counter = 0
  var q = new Queue(0.1).onShift(iter => {
    if (++counter === 1) {
      t.equal(iter.next().value, 1)
      t.equal(iter.next().value, 2)
    } else if (counter === 2) {
      t.equal(iter.next().value, 3)
      t.ok(iter.next().done)
    }
  })
  q.add(1)
  q.add(2)
  q.add(3, 2)
  q.tick()
  q.tick()
  t.notOk(q.has(1))
  t.notOk(q.has(2))
  t.notOk(q.has(3))
})

test('manual stop before timer', t => {
  var q = new Queue()
  q.add(null, 2)
  q.stop()
  t.ok(q.has(null))
  t.equal(q.items().next().value, null)
  t.end()
})
