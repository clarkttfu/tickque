const Denque = require('denque')

module.exports = class {
  /**
   * @param {Number} interval >=0.001 in seconds
   * @param {Number} limit the maximum queue length, defaults 0 = no limit
   */
  constructor (interval = 1, limit = 0, preAlloc = false) {
    this._interval = interval >= 0.001 ? interval : 0.001 // seconds
    this._limit = limit > 0 ? limit : 0
    this._map = new Map()
    this._queue = new Denque()
    this._callbacks = new Set()
    this._timer = undefined

    if (preAlloc) {
      while (this._queue.length < limit) {
        this._queue.push(new Set())
      }
    }
  }

  /**
   * @returns {Number} current queue length
   */
  get length () {
    return this._queue.length
  }

  /**
   * @param {Function} callback will be called with shifted items Iterator on tick
   */
  onShift (callback /* (shifted {Set}) => {} */) {
    if (typeof callback === 'function') {
      this._callbacks.add(callback)
    }
    return this
  }

  tick () {
    const bucket = this._queue.shift()
    if (bucket && bucket.size > 0) {
      const shifted = bucket.values()
      for (const cb of this._callbacks) {
        try { cb(shifted, bucket.size) } catch (err) {}
      }
      for (const item of bucket) {
        this._map.delete(item)
      }
    }
    if (this._map.size < 1) this.stop() // autostop
  }

  start (tickNow = false) {
    if (tickNow) this.tick()
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
   * O(1)
   * @param {*} item to be put into specific queue bucket
   * @param {Number} ttl tick to live, >=1 or defaults to limit
   * @returns {Boolean} true if item is added successfully
   */
  add (item, ttl) {
    if (item === undefined || ttl < 1) return false
    if (ttl > (this._limit || ttl || 1)) return false

    let index = -1
    let length = this._limit || 1
    if (ttl > 0) {
      index = ttl - 1
      length = ttl
    }
    while (this._queue.length < length) {
      this._queue.push(new Set())
    }
    if (this._map.has(item)) {
      this._map.get(item).delete(item)
    }
    const bucket = this._queue.peekAt(index).add(item)
    this._map.set(item, bucket)
    this.start()
    return true
  }

  /**
   * O(1)
   * @param {Number} [ttl] the time bucket to be returned, defaults to the first bucket
   * @returns {Iterator} time bucket items
   */
  peek (ttl) {
    if (ttl > this.length || ttl < 1) return
    return this._queue.peekAt(ttl - 1).values()
  }

  /**
   * O(1)
   * @param {*} item that is to be removed
   * @returns {Boolean} true if the queue contains item
   */
  remove (item) {
    if (this.has(item)) {
      this._map.get(item).delete(item)
      this._map.delete(item)
      if (this._map.size < 1) {
        this.stop() // autostop
      }
      return true
    }
    return false
  }

  /**
   * O(1)
   * @returns {Boolean} whether contains the given item
   */
  has (item) {
    return this._map.has(item)
  }

  /**
   * O(1)
   * @returns {Iterator} all the items
   */
  items () {
    return this._map.keys()
  }

  /**
   * O(1)
   * @return {Number} count number of all items in queue
   */
  count () {
    return this._map.size
  }
}
