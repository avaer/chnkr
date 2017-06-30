const chnkr = require('.');

const chunker = chnkr.makeChunker({
  resolution: 32,
  lod: 1,
});

console.log(JSON.stringify({updates: chunker.update(0, 0), chunks: chunker.chunks}, null, 2));

console.log(JSON.stringify({updates: chunker.update(20, 0), chunks: chunker.chunks}, null, 2));
