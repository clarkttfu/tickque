const should = require('should')
const Queue = require('../index')

describe('Test TimerQueue', () => {
//
  it('check default values', () => {
    var q = new Queue()
    should(q._timer).be.null()
    should(q._callbacks instanceof Set).be.true()
    q._callbacks.size.should.equal(0)
    q._limit.should.equal(1800) // seconds
    q.length.should.equal(10)
  })

  it('limit length by interval (divisor)', () => {
    var q = new Queue(7)
    q._limit.should.equal(258)
  })

  it('add nothing if ttl <= 0', () => {
    var q = new Queue()
    q.add('will not be added', 0).should.be.false()
    q.add('will not be added', -1).should.be.false()
    q.has('will not be added').should.be.false()
  })

  it('add nothing if ttl > limit', () => {
    var q = new Queue()
    q.add('will be added', 1800).should.be.true()
    q.add('out of limit range', 1801).should.be.false()
    q.stop()
  })

  it('tick and shift successfully', done => {
    var q = new Queue(1, 1)
    var cb = array => {
      array.length.should.be.equal(1)
      array[0].should.equal('test')
      done()
    }
    q.onShift(cb)
    q.onShift(cb) // no dup, so does nothing
    q._queue.peekAt(0).add('test')
    q._callbacks.size.should.equal(1)
    q.tick()
  })

  it('remove plain object by reference', done => {
    var item = {}
    var q = new Queue(0.5, 1).onShift(o => {
      o[0].should.equal(item)
      done()
    })
    q.add(item)
    q.remove({}).should.be.false()
    q.has(item).should.be.true()
    q.items().next().value = item
  })

  it('remove successfully', done => {
    var q = new Queue(1, 2)
    var counter = 0
    var cb = array => {
      if (++counter === 1) {
        array[0].should.equal(1)
      } else if (counter === 2) {
        array[0].should.equal(3)
        done()
      }
    }
    q.onShift(cb)
    q.add(1, 1)
    q.peek(1).has(1).should.be.true()
    q.add(1) // same id but different ttl(2)
    q.add(2)
    q.add(3)
    q.peek(2).has(1).should.be.true()
    q.peek(2).has(2).should.be.true()
    q.peek(2).has(3).should.be.true()
    should(q.peek(3)).be.undefined() // out of range
    q.tick()
    q.peek(1).has(1).should.be.true()
    q.remove(1).should.be.true()
    q.peek(1).has(1).should.be.false()
    q.peek(1).has(2).should.be.true()
    q.peek(1).has(3).should.be.true()
    q.remove(2).should.be.true()
    q.tick()
    q.remove(3).should.be.false()
    q.has(1).should.be.false()
    q.has(2).should.be.false()
    q.has(3).should.be.false()
  })

  it('should auto stop if queue is empty', done => {
    var q = new Queue(0.2, 1).onShift(done) // this causes error
    q.add('foo')
    q.remove('foo')
    setTimeout(done, 200)
  })

  it('should not stop if queue is not empty', done => {
    var q = new Queue(0.2, 3).onShift(() => done())
    q.add(1, 2)
    q.add(2, 3)
    q.remove(1)
  })

  var finalQueue = new Queue(0.2, 2, 3)
  it('push then start to work', done => {
    var counter = 0
    // 1: [ 'hello', 'world' ]
    // 2: [ 37 ]
    // 3: [ 12, 23 ]
    finalQueue.onShift(array => {
      if (++counter === 1) {
        array[0].should.equal('hello')
        array[1].should.equal('world')
        finalQueue.add(23, 2)
      } else if (counter === 2) {
        array[0].should.equal(37)
      } else {
        array[0].should.equal(12)
        array[1].should.equal(23)
        done()
      }
    })
    finalQueue.add(37) // this goes to the 2nd slot due to queue length
    finalQueue.add('hello', 1)
    finalQueue.add('world', 1)
    finalQueue.add(12, 3) // increase length to 3
  })

  after(() => finalQueue.stop())
})
