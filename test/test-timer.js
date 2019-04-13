const should = require('should')
const Queue = require('../index')

describe('Test tick timer', () => {
  it('tick and shift of length 1', done => {
    var q = new Queue(0, 1, true)
    var cb = iter => {
      var i = 0
      for (let it of iter) {
        should(it).equal(++i)
      }
      should(q.length).equal(0)
      should(q.count()).equal(0)
      should(i).equal(3)
      done()
    }
    q.onShift(cb)
    q._queue.peekAt(0).add(1)
    q._queue.peekAt(0).add(2)
    q._queue.peekAt(0).add(3)
    q.start(true) // tick immediately, length--
  })

  it('auto stop once queue is empty', done => {
    let callback = null
    var q = new Queue(0.01).onShift(v => (callback = v.next().value))
    q.add('foo')
    setTimeout(() => {
      q.remove('foo')
      should(q.count()).equal(0)
      should(callback).equal('foo')
      should(q._timer).be.undefined()
      done()
    }, 50)
  })

  it('will not stop if queue is not empty', done => {
    var q = new Queue(0.01, 3).onShift(v => {
      should(v.next().value).equal(3)
      should(v.next().done).be.true()
      done()
    })
    q.add(2, 2)
    q.add(3, 3)
    q.remove(1)
  })

  it('manual tick before timer', done => {
    var counter = 0
    var q = new Queue(0.1).onShift(iter => {
      if (++counter === 1) {
        iter.next().value.should.equal(1)
        iter.next().value.should.equal(2)
      } else if (counter === 2) {
        iter.next().value.should.equal(3)
        iter.next().done.should.be.true()
        done()
      }
    })
    q.add(1)
    q.add(2)
    q.add(3, 2)
    q.tick()
    q.tick()
    q.has(1).should.be.false()
    q.has(2).should.be.false()
    q.has(3).should.be.false()
  })

  it('manual stop before timer', done => {
    var q = new Queue()
    q.add(null, 2)
    q.stop()
    q.has(null).should.be.true()
    should(q.items().next().value).be.null()
    done()
  })
})
