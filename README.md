# tickque
A queue that auto shift itself based on the given interval.

- You might not want to create timer for each incoming request.
- The queue is designed to align those requests into time slots for you.
- Time slots will be shifted at given interval, so the requests could be processed in batch at your pace.

## Get started

```
const Queue = require('tickque')

let queue = new Queue()
queue.onShift(items => { ... })

queue.add(() => console.log('print after 2 sec'), 2)
queue.add(() => console.log('print after 10 sec'))
```

## API

### Queue(interval = 1, length = 10, limit, hash)
- interval: auto shifting interval in second, 0.2 second minimum
- length: initial queue length which affect default ttl (tick to live)
- limit: maximum queue length
- hash: function used to create hashtag / id for the supplied items

### onShift(cb)
- `cb` will be invoked with the items (array) in the shifted time slot

### add(item, ttl)
- item: the object to be inserted into the `ttl` specified time slot
- ttl: tick to live -- time slot offset (positive integer)

The queue will grow automatically (until `limit` is reached) if ttl is larger than current queue length.

*Note: item could be added multiple times into different time slots.*

### hash(item)
The queue use map to track the items internally so you'd better use your own hash function if item has id field.

### peek(ttl)
Returns the items in the given time slot.

### remove(item)
Remove the given item.

### has(item)
Check if the item is in the queue.

### start(immediate = false)
- immediate: tick at once if true, otherwise tick after `interval`

Start queue shifting. *Note the queue will start automatically when item is added.*

### stop()
Stop queue shifting. *Note the queue will stop automatically once it's empty.*

### items()
Returns all tracke items.

### length
Returns the queue length.
