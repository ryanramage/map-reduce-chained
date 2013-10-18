var chained_map_reduce = require('..'),
    rimraf = require('rimraf'),
    numpad = require('numpad'),s
    t = rimraf.sync('/tmp/map-reduce-example'),
    db = require('level-sublevel')(require('level')('/tmp/map-reduce-example')),
    nil_map = function(key, value, emit){},
    assert = require('assert');

var chains = chained_map_reduce(db, [
    {
        url: 'http://localhost:5984/smalls',
        transform: function(row, emit){
            delete row.doc._id;
            delete row.doc._rev;
            emit(row.id, JSON.stringify(row.doc));
        },
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
            emit(numpad(value, 3), key);
        }
    }
]);


setTimeout(test_chains, 3000);


function test_chains(){
    db.getBy('sales', ['ryan'], function (err, data) {
        console.log('ryan sales', err, data);
    })

    chains[1].db.getBy('top_sales', [], {reverse: true, limit: 10}, function(err, data) {
        console.log('top sales', err, data);
        process.exit();
    });

}
