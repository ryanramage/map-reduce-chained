var chained_map_reduce = require('..'),
    rimraf = require('rimraf'),
    async = require('async'),
    couchr = require('couchr'),
    numpad = require('numpad'),
    debounce = require('lodash.debounce'),
    couch_data = require('./assets/couch_data'),
    t = rimraf.sync('/tmp/map-reduce-example'),
    db = require('level-sublevel')(require('level')('/tmp/map-reduce-example')),
    assert = require('assert'),
    chains;


// just some setup to create the couch, and load it with the test data
async.series([
    function(cb){
        couchr.del('http://localhost:5984/sales', function() {
            cb(); // just ignore errors on the delete, might not exist
        });
    },
    async.apply( couchr.put, 'http://localhost:5984/sales'),
    async.apply( couchr.post,'http://localhost:5984/sales/_bulk_docs', couch_data),
    makeChains,
], function(err, data) {

    // wait till all the reduces are done before getting the final answer
    var after_reduce = debounce(test_chains, 200);
    chains[0].db._mappedIndexes['sales'].on('reduce', after_reduce);
})


function makeChains(cb) {
    chains = chained_map_reduce(db, [
        {
            name: 'sales',
            url: 'http://localhost:5984/sales',
            transform: function(row, emit){
                delete row.doc._id;
                delete row.doc._rev;
                emit(row.id, JSON.stringify(row.doc));
            },
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
    cb();
}


function test_chains(){
    db.getBy('sales', ['ryan'], function (err, data) {
        console.log('ryan sales', err, data);
    })

    chains[1].db.getBy('top_sales', [], {reverse: true, limit: 10}, function(err, data) {
        console.log('top sales', err, data);
        process.exit();
    });

}
