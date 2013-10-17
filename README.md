map-reduce-chained
==================

Make chains of map reduced data. Why? to something like this: http://examples.cloudant.com/sales/_design/sales/index.html#basic

Usage:
-------

```
npm install map-reduce-chained
```

Goal: get the top 10 sales users.

```
    var chained_map_reduce = require('map-reduce-chained'),
        db = require('level-sublevel')(require('level')('/tmp/map-reduce-example'));


    chained_map_reduce(db, [
        {
            map: function(key, value, emit) {
                var doc = JSON.parse(value);
                if (doc.type === 'sale')
                    emit(doc.user, doc.price);
            },
            reduce: function (acc, v) {
              return Number(acc || 0) + Number(v)
            }
        },
        {
            name: 'top_sales',
            map: function(key, value, emit) {
                console.log('second map', value, key);
                emit(value, key);
            }
        }
    ]);


    db.put('1', JSON.stringify({  type: 'sale', user: 'ryan', price: '10'  }));
    db.put('2', JSON.stringify({  type: 'sale', user: 'bobi', price: '12'  }));
    db.put('3', JSON.stringify({  type: 'sale', user: 'ryan', price: '3'   }));
```