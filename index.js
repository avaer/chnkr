const mod = require('mod-loop');

class Chunk {
  constructor(x, z, lod) {
    this.x = x;
    this.z = z;
    this.lod = lod;
    this.lastLod = lod;
  }
}

class Chunker {
  constructor({resolution = 16, range = 1} = {}) {
    this.resolution = resolution;
    this.range = range;

    this.chunks = {};
  }

  getChunk(x, z) {
    return this.chunks[_getChunkIndex(x, z)];
  }

  update(cx, cz) {
    const {resolution, range, chunks} = this;

    const added = [];
    const removed = [];
    const relodded = [];

    // find required chunks
    const requiredChunks = (() => {
      const result = {};

      const width = range + 1;
      const widthHalf = Math.ceil(width / 2);
      const widthHalfFloor = Math.floor(width / 2);

      const ox = Math.round(cx / resolution) - widthHalfFloor;
      const oz = Math.round(cz / resolution) - widthHalfFloor;

      const _addRequiredChunk = (dx, dz, lod) => {
        const chunk = new Chunk(
          ox + dx,
          oz + dz,
          lod
        );
        result[_getChunkIndex(chunk.x, chunk.z)] = chunk;
      };

      for (let level = widthHalf - 1; level >= 0; level--) {
        const start = level;
        const end = width - level;
        const lod = widthHalf - level;

        for (let l = width-level-2; l > width - 1 - end; l--) {
          _addRequiredChunk(start, l, lod);
        }
        for (let k = start+1; k < end - 1; k++) {
          _addRequiredChunk(k, width - end, lod);
        }
        for (let j = width - end; j < width - level - 1; j++) {
          _addRequiredChunk(end - 1, j, lod);
        }
        for (let i = end - 1; i >= start; i--) {
          _addRequiredChunk(i, width - 1 - level, lod);
        }
      }
      return result;
    })();

    // remove outranged chunks
    let updated = false;
    for (const index in chunks) {
      const chunk = chunks[index];

      if (!requiredChunks[index]) {
        removed.push(chunk);
        chunks[index] = null;

        updated = true;
      }
    }

    // flag relodded chunks
    for (const index in requiredChunks) {
      const requiredChunk = requiredChunks[index];
      const existingChunk = chunks[index];

      if (existingChunk && existingChunk.lod !== requiredChunk.lod) {
        existingChunk.lastLod = existingChunk.lod;
        existingChunk.lod = requiredChunk.lod;
        relodded.push(existingChunk);
      }
    }

    // add new chunks
    for (const index in requiredChunks) {
      const requiredChunk = requiredChunks[index];

      if (!chunks[index]) {
        added.push(requiredChunk);
        chunks[index] = requiredChunk;

        updated = true;
      }
    }

    // compute new chunks
    if (updated) {
      const newChunks = {};
      for (const index in chunks) {
        const chunk = chunks[index];
        if (chunk) {
          newChunks[index] = chunk;
        }
      }
      this.chunks = newChunks;
    }

    return {
      added,
      removed,
      relodded,
    };
  }
}
const _getChunkIndex = (x, z) => (mod(x, 0xFFFF) << 16) | mod(z, 0xFFFF);

const _makeChunker = options => new Chunker(options);

module.exports = {
  makeChunker: _makeChunker,
};
