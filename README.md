# tickque
A queue that auto shift itself based on the given interval.

- You might not want to create timer for each incoming request.
- The queue is designed to align those requests into `time slots`.
- When each time slot is shifted, process requests in the slot in batch.

## Get started

```
const Queue = require('tickque')

let queue = new Queue(1, 10, true)
queue.onShift(itemsIterator => { ... })

queue.add('shifted after 10 sec'))
queue.add('shifted after 2 sec'), 2)
```

## API

### Queue(interval = 1, limit = 0, preAlloc = false)
- interval: auto shifting interval in second
- limit: maximum ttl (queue length), which make it fixed length
- preAlloc: alloc slots during construction if `limit` > 0

**Note: It's possible to set `interval` to float point but the queue uses `setInterval` which cannot guarantee pricise timers. There will be ms delays (depending on CPU usage) before each `onShift` callback due to single thread JS model. It's roughly 1 second error every 8 minutes**

### onShift(cb)
- `cb` will be invoked with the items iterator in the shifted time slot

### add(item, ttl)
- item: the object to be inserted into the `ttl` specified time slot
- ttl: tick to live -- time slot offset (positive integer)

The queue grows automatically until `limit`, if `ttl` is larger than current queue length.
This is one time `O(n)` operation, `n` equals the length of queue.
When queue is contructred with `preAlloc`, complexity is always `O(1)`.
If `ttl` is omitted, item is added to the end of queue.

### peek(ttl)
Returns the items in the given time slot in `O(1)`. 

### remove(item)
Remove the given item in `O(1)`.

### has(item)
Check if the item is in the queue in `O(1)`.

### length
Returns the queue length in `O(1)`.

### items()
Returns iterator of all items in `O(1)`.

### count()
Returns number of all items in `O(1)`.

### start(immediate = false)
- immediate: tick at once if true, otherwise tick after `interval`

Start queue shifting. *Note the queue starts automatically when item is added.*

### stop()
Stop queue shifting. *Note the queue stops automatically once it's empty.*
