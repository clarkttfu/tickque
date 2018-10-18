const Denque = require('denque')

class TimerQueue {
  /**
   * @param {Number} interval >=1 in seconds
   * @param {Number} length default (init) queue length
   * @param {Number} limit the maximum queue length, >=1
   * @param {Function} hash to override default simple implementation
   */
  constructor (interval = 1, length = 10, limit, hash) {
    this._interval = interval >= 0.2 ? interval : 0.2 // seconds
    this._limit = limit >= 1 ? limit : Math.ceil(30 * 60 / this._interval) // 30 mins
    this._items = new Map()
    this._trace = new Map()
    if (typeof hash === 'function') {
      this.hash = hash
    }
    this._timer = null
    this._callbacks = new Set()
    this._queue = new Denque()
    while (this._queue.length < length) {
      this._queue.push(new Set())
    }
  }

  /**
   * @returns {Number} current queue length
   */
  get length () {
    return this._queue.length
  }

  /**
   * Simple function to create hash tag for items.
   * @param {Object} item
   * @returns {Object} tag that is used to track the item for fast deletion
   */
  hash (item) {
    return item
  }

  /**
   * @param {Function} callback is called on tick with items in the shifted(first) bucket
   */
  onShift (callback /* (shifted {Set}) => {} */) {
    if (typeof callback === 'function') {
      this._callbacks.add(callback)
    }
    return this
  }

  tick () {
    this._queue.push(new Set())
    const bucket = this._queue.shift()
    if (bucket.size > 0) {
      const items = this._items
      const shifted = Array.from(bucket)
      this._callbacks.forEach(cb => {
        try { cb(shifted) } catch (err) {}
      })
      this._trace.forEach((v, k, map) => { // TODO: this could be slow
        if (v.delete(bucket) && v.size === 0) {
          map.delete(k)
          items.delete(k)
        }
      })
    }
    if (this._trace.size < 1) this.stop() // autostop
  }

  start (immediate = false) {
    if (immediate) this.tick()
    if (!this._timer) {
      this._timer = setInterval(this.tick.bind(this), this._interval * 1000)
    }
    return this
  }

  stop () {
    if (this._timer) {
      this._timer = clearInterval(this._timer)
    }
    return this
  }

  /**
   * @param {*} item to be put into specific queue bucket
   * @param {Number} ttl tick to survive
   * @returns {Boolean} true if item is added or it replaces existing one
   */
  add (item, ttl) {
    if (ttl === undefined || (ttl > 0 && ttl <= this._limit)) {
      while (ttl > this._queue.length) {
        this._queue.push(new Set())
      }
      let index = ttl > 0 ? ttl - 1 : -1
      let tag = this.hash(item)
      let bucket = this._queue.peekAt(index).add(item)
      let tracking = this._trace.get(tag) || new Set()
      this._trace.set(tag, tracking.add(bucket))
      this._items.set(tag, item)
      this.start()
      return true
    }
    return false
  }

  /**
   * @param {Number} [ttl] the time bucket to be returned, defaults to the first bucket
   * @returns {Set} time bucket
   */
  peek (ttl) {
    return this._queue.peekAt(ttl > 0 ? ttl - 1 : 0)
  }

  /**
   * @param {*} item that is to be removed
   * @returns {Boolean} true if the queue contains items of the given tag
   */
  remove (item) {
    let tag = this.hash(item)
    Array.from(this._trace.get(tag) || []).forEach(bucket => {
      bucket.forEach(value => item === value && bucket.delete(value))
    })
    let ifDeleted = this._trace.delete(tag)
    this._items.delete(tag)
    if (this._trace.size < 1) this.stop() // autostop
    return ifDeleted
  }

  /**
   * @returns {Boolean} whether contains the given item
   */
  has (item) {
    return this._trace.has(this.hash(item))
  }

  items () {
    return this._items.values()
  }
}

module.exports = TimerQueue
