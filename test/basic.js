var chained_map_reduce = require('..'),
    rimraf = require('rimraf'),
    t = rimraf.sync('/tmp/map-reduce-example'),
    db = require('level-sublevel')(require('level')('/tmp/map-reduce-example')),
    nil_map = function(key, value, emit){},
    assert = require('assert');



// assert.throws(function test_null_db(){ chained_map_reduce(null); } );
// assert.throws(function test_empty_chains() { chained_map_reduce(function(){}, []) } );

// assert.doesNotThrow(function(){
//     chained_map_reduce(db,[
//         { map: nil_map }
//     ])
// })

// assert.throws(function test_couch_second () {
//     chained_map_reduce(db,[{map: nil_map}, {url: 'http://some.com:5984'}])
// })





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
