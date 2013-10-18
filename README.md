map-reduce-chained
==================

Make chains of map reduced data. Why? to something like this: http://examples.cloudant.com/sales/_design/sales/index.html#basic


[![Build Status](https://travis-ci.org/ryanramage/map-reduce-chained.png)](https://travis-ci.org/ryanramage/map-reduce-chained)


Usage:
-------

```
npm install map-reduce-chained
```

Goal: get the top 10 sales users.

```
var chains = chained_map_reduce(db, [
    {
        name: 'sales',
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
            emit(numpad(value, 3), key); // until map-reduce is fixed for numeric key ordering
        }
    }
]);

var b = [
    {type: 'put', key: '1',  value: JSON.stringify({  type: 'sale', user: 'ryan', price: '10'  }) },
    {type: 'put', key: '2',  value: JSON.stringify({  type: 'sale', user: 'bobi', price: '12'  }) },
    {type: 'put', key: '3',  value: JSON.stringify({  type: 'sale', user: 'ryan', price: '3'   }) },
    {type: 'put', key: '4',  value: JSON.stringify({  type: 'sale', user: 'ryan', price: '10'  }) },
    {type: 'put', key: '5',  value: JSON.stringify({  type: 'sale', user: 'bobi', price: '12'  }) },
    {type: 'put', key: '6',  value: JSON.stringify({  type: 'sale', user: 'gary', price: '04'  }) },
    {type: 'put', key: '7',  value: JSON.stringify({  type: 'sale', user: 'ryan', price: '3'   }) },
    {type: 'put', key: '8',  value: JSON.stringify({  type: 'sale', user: 'doug', price: '10'  }) },
    {type: 'put', key: '9',  value: JSON.stringify({  type: 'sale', user: 'bobi', price: '12'  }) },
    {type: 'put', key: '10', value: JSON.stringify({  type: 'sale', user: 'ryan', price: '3'   }) },
    {type: 'put', key: '11', value: JSON.stringify({  type: 'sale', user: 'norm', price: '5'   }) },
    {type: 'put', key: '12', value: JSON.stringify({  type: 'sale', user: 'bill', price: '4'   }) },
    {type: 'put', key: '13', value: JSON.stringify({  type: 'sale', user: 'lau' , price: '20'  }) },
    {type: 'put', key: '14', value: JSON.stringify({  type: 'sale', user: 'jose', price: '15'  }) },
    {type: 'put', key: '15', value: JSON.stringify({  type: 'sale', user: 'cody', price: '3'   }) },
    {type: 'put', key: '16', value: JSON.stringify({  type: 'sale', user: 'jenn', price: '33'  }) }
];

db.batch(b, wait);

function wait(){
    setTimeout(test_chains, 100);
}

function test_chains(){
    db.getBy('sales', ['ryan'], function (err, data) {
        assert.ifError(err);
        assert.equal(data.length, 5);
        console.log('ryan sales', err, data);
    })

    chains[1].db.getBy('top_sales', [], {reverse: true, limit: 10}, function(err, data) {
        assert.equal(data.length, 10);
        var last;
        data.forEach(function(row){
            if (last) {
                assert.ok(Number(row.value) <= Number(last.value));
            }
            last = row;
        })
        console.log('top sales', err, data);
    });

}

```

ouput:

```
ryan sales
[ { key: '10',value: '{"type":"sale","user":"ryan","price":"10"}' },
  { key: '3', value: '{"type":"sale","user":"ryan","price":"3"}' },
  { key: '3', value: '{"type":"sale","user":"ryan","price":"3"}' },
  { key: '10',value: '{"type":"sale","user":"ryan","price":"10"}' },
  { key: '3', value: '{"type":"sale","user":"ryan","price":"3"}' } ]

top sales
[ { key: 'bobi', value: '36' },
  { key: 'jenn', value: '33' },
  { key: 'ryan', value: '29' },
  { key: 'lau',  value: '20' },
  { key: 'jose', value: '15' },
  { key: 'doug', value: '10' },
  { key: 'norm', value: '5' },
  { key: 'gary', value: '4' },
  { key: 'bill', value: '4' },
  { key: 'cody', value: '3' } ]
```


