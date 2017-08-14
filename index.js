const mod = require('mod-loop');

class Chunk {
  constructor(x, z, lod) {
    this.x = x;
    this.z = z;
    this.lod = lod;
  }
}

class Chunker {
  constructor({resolution = 32, range = 1} = {}) {
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

      const _addRequiredChunk = (dx, dz, lod) => {
        const chunk = new Chunk(
          Math.floor((cx + dx) / resolution),
          Math.floor((cz + dz) / resolution),
          lod
        );
        result[_getChunkIndex(chunk.x, chunk.z)] = chunk;
      };

      for (let radius = 1; radius <= range; radius++) {
        const baseDistance = (resolution / 4) + ((radius - 1) * resolution);

        // left
        for (let i = 0; i < (radius * 2) - 1; i++) {
          _addRequiredChunk(-baseDistance, -baseDistance + (i * resolution), radius);
        }
        // front
        for (let i = 1; i <= (radius * 2) - 1; i++) {
          _addRequiredChunk(-baseDistance + (i * resolution), -baseDistance, radius);
        }
        // right
        for (let i = 1; i <= (radius * 2) - 1; i++) {
          _addRequiredChunk(baseDistance, -baseDistance + (i * resolution), radius);
        }
        // back
        for (let i = 0; i < (radius * 2) - 1; i++) {
          _addRequiredChunk(-baseDistance + (i * resolution), baseDistance, radius);
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
