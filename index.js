var levelCouchSync = require('level-couch-sync'),
    MapReduce = require('map-reduce');

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
    chain.sublevel_name = 'chain-' + count;
    if (chain.url) chainCouch(db, count++, chain, mapreduces);
    else chainMR(db, count++, chain, mapreduces);
  })
}

function chainCouch(db, count, chain, mapreduces) {
  if (count > 0) throw new Error('couch chain must be exactly first in the chain');
  var transform = undefined,
      level_name = chain.sublevel_name || chain.name;
  if (chain.transform) transform = chain.transform;
  levelCouchSync(chain.url, db, level_name, transform);
  mapreduces.push({db: level_name});

}



function chainMR(db, count, chain, mapreduces) {

  var level_name =  chain.name || chain.sublevel_name,
      i = count - 1,
      prev,
      cur_db;
  if (i >= 0 && mapreduces[i]) {
      prev = mapreduces[i];
      cur_db = db.sublevel(level_name);
  } else cur_db = db;

  var sub_mr = MapReduce(cur_db, level_name + '-mr', chain.map, chain.reduce);
  mapreduces.push({db: level_name, mr: sub_mr});

  if (prev && prev.mr) {
    prev.mr.on('reduce', function(group, val){
      if (group.length && group.length > 0) {
        cur_db.put(group, val);
      }
    })
  }
}