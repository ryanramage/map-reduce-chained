var levelCouchSync = require('level-couch-sync'),
    mappedIndex = require('level-mapped-index');

module.exports = function(db, chains, options){
  // validate options
  if (!db || 'function' === typeof db)
    throw new Error('db *must* be a string or a level-sublevel instance');
  if (!chains || chains.length === 0)
    throw new Error('chains must be an array of length 1');

  // setup all the sublevel names
  var count = 0,
      mapreduces = [];
  chains.forEach(function(chain){
    chain.sublevel_name = chain.name || 'chain-' + count;
    if (chain.url) chainCouch(db, count++, chain, mapreduces);
    else chainMR(db, count++, chain, chains);
  })

  return chains;
}

function chainCouch(db, count, chain, chains) {
  if (count > 0) throw new Error('couch chain must be exactly first in the chain');
  var transform = undefined;
  if (chain.transform) transform = chain.transform;
  chain.db = db.sublevel(chain.sublevel_name);
  levelCouchSync(chain.url, db, chain.sublevel_name, transform);
  chainMR(db, count, chain, chains);
}



function chainMR(db, count, chain, chains) {

  var cur_db = db,
      index_db,
      prev;

  if (count > 0) {
      prev = chains[count - 1];
      cur_db = db.sublevel(chain.sublevel_name);
      index_db = cur_db.sublevel('index');
      chain.db = mappedIndex(cur_db)
      chain.db.registerIndex(chain.sublevel_name, chain.map, chain.reduce, chain.initial)

      //chain.db = index_db;
      //index_db = mappedIndex(cur_db);
  } else {
    cur_db = db.sublevel(chain.sublevel_name);
    index_db = mappedIndex(db);
    index_db.registerIndex(cur_db, chain.sublevel_name, chain.map, chain.reduce, chain.initial)
    chain.db = index_db;
  }


  chain.mapreduce = true;

  //console.log(prev);

  if (prev && prev.mapreduce) {
    prev.db._mappedIndexes[prev.sublevel_name].on('reduce', function(group, val){
      if (group.length && group.length > 0) {
        cur_db.put(group, val);
      }
    })
  }
}