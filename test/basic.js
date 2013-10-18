var chained_map_reduce = require('..'),
    rimraf = require('rimraf'),
    bytewise = require('bytewise'),
    numpad = require('numpad'),s
    t = rimraf.sync('/tmp/map-reduce-example'),
    db = require('level-sublevel')(require('level')('/tmp/map-reduce-example')),
    nil_map = function(key, value, emit){},
    assert = require('assert');



assert.throws(function test_null_db(){ chained_map_reduce(null); } );
assert.throws(function test_empty_chains() { chained_map_reduce(function(){}, []) } );

assert.doesNotThrow(function(){
    chained_map_reduce(db,[
        { map: nil_map }
    ])
})

assert.throws(function test_couch_second () {
    chained_map_reduce(db,[{map: nil_map}, {url: 'http://some.com:5984'}])
})





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
            var thing = bytewise.encode(value) ;
            emit(numpad(value, 3), key);
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



