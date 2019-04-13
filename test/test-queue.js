const should = require('should')
const Queue = require('../index')

describe('Test TickQueue methods', () => {
  it('default constructor', () => {
    var q = new Queue()
    should(q._interval).equal(1)
    should(q._limit).equal(0)
    should(q._timer).be.undefined()
    should(q._callbacks.size).equal(0)
    should(q.length).equal(0)
  })

  it('construct with params', () => {
    var q = new Queue(7, 2)
    should(q._interval).equal(7)
    should(q._limit).equal(2)
    should(q._timer).be.undefined()
    should(q._callbacks.size).equal(0)
    should(q.length).equal(0)
  })

  it('onShift avoid duplicate callbacks', () => {
    var q = new Queue()
    var noop = () => {}
    q.onShift(noop)
    q.onShift(noop)
    should(q._callbacks.size).equal(1)
    should(q.length).equal(0)
  })

  it('add nothing if item is undefined', () => {
    var q = new Queue()
    should(q.add()).be.false()
    should(q.add(undefined, 1)).be.false()
    should(q.length).equal(0)
  })

  it('add nothing if ttl <= 0', () => {
    var q = new Queue()
    should(q.add(null, 0)).be.false()
    should(q.add(null, -1)).be.false()
    should(q.length).equal(0)
  })

  it('add nothing if ttl > limit', () => {
    var q = new Queue(1, 2)
    should(q.add(null, 3)).be.false()
    should(q.length).equal(0)
  })

  it('add to the end of queue, without growing', () => {
    var q = new Queue()
    var i = 0
    while (i < 10000) {
      should(q.add(++i)).be.true()
      should(q.length).equal(1)
      should(q.count()).equal(i)
    }
    q.stop()
  })

  it('add to the end of limited queue', () => {
    var q = new Queue(1, 5)
    var i = 0
    while (i < 20) {
      should(q.add(++i)).be.true()
      should(q.length).equal(5)
      should(new Set(q.peek(5)).size).equal(i)
      should(q.count()).equal(i)
    }
    q.stop()
  })

  it('add and grow dynamically', () => {
    var q = new Queue()
    var i = 0
    while (i < 10000) {
      should(q.add(++i, i)).be.true()
      should(q.length).equal(i)
      should(q.count()).equal(i)
    }
    q.stop()
  })

  it('add with new ttl', () => {
    var q = new Queue()
    q.add(1, 2)
    q._queue.peekAt(0).has(1).should.be.false()
    q._queue.peekAt(1).has(1).should.be.true()
    q.add(1) // to the end of queue: ttl=2
    q._queue.peekAt(0).has(1).should.be.false()
    q._queue.peekAt(1).has(1).should.be.true()
    q.add(1, 1)
    q._queue.peekAt(0).has(1).should.be.true()
    q._queue.peekAt(1).has(1).should.be.false()
    should(q.peek(3)).be.undefined()
    q.stop()
  })

  it('add and grow with limit', () => {
    var q = new Queue(1, 2)
    should(q.length).equal(0)
    should(q.add(null, 1)).be.true()
    should(q.length).equal(1)
    should(q.count()).equal(1)
    should(q.add(null, 2)).be.true()
    should(q.length).equal(2)
    should(q.count()).equal(1)
    should(q.add(null, 3)).be.false()
    should(q.length).equal(2)
    should(q.count()).equal(1)
    q.stop()
  })

  it('remove returns boolean', () => {
    var q = new Queue()
    should(q.add(null)).be.true()
    should(q.remove(null)).be.true()
    should(q.remove(null)).be.false()
    should(q.length).equal(1)
    should(q.count()).equal(0)
    should(q.add(null, 3)).be.true()
    should(q.count()).equal(1)
    should(q.remove(null)).be.true()
    should(q.length).equal(3)
    should(q.count()).equal(0)
    q.stop()
  })
})
