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

    const ox = Math.round(cx / resolution);
    const oz = Math.round(cz / resolution);

    const added = [];
    const removed = [];
    const relodded = [];

    const X = range;
    const Y = range;
    const Xhalf = X/2;
    const Yhalf = Y/2;
    const _spiral = fn => {
      let x, y, dx, dy;
      x = y = dx = 0;
      dy = -1;
      let t = Math.max(X, Y);
      const maxI = t*t;
      for (let i = 0; i < maxI; i++){
        if ((-Xhalf <= x) && (x <= Xhalf) && (-Yhalf <= y) && (y <= Yhalf)) {
          if (fn(-y, x) === false) {
            return false;
          }
        }
        if ((x == y) || ((x < 0) && (x == -y)) || ((x > 0) && (x == 1-y))) {
          t = dx;
          dx = -dy;
          dy = t;
        }
        x += dx;
        y += dy;
      }
      return true;
    };
    const minX = ox - Math.floor((X - 1) / 2);
    const maxX = ox + Math.floor(X / 2);
    const minY = oz - Math.floor(Y / 2);
    const maxY = oz + Math.floor((Y - 1) / 2);

    // remove outranged chunks
    let updated = false;
    for (const index in chunks) {
      const chunk = chunks[index];

      if (chunk.x < minX || chunk.x > maxX || chunk.z < minY || chunk.z > maxY) {
        chunks[index] = null;
        removed.push(chunk);

        updated = true;
      }
    }

    // flag relodded chunks
    for (const index in chunks) {
      const existingChunk = chunks[index];

      if (existingChunk) {
        const expectedLod = Math.max(Math.abs(existingChunk.x - ox), Math.abs(existingChunk.z - oz)) + 1;

        if (existingChunk.lod !== expectedLod) {
          existingChunk.lastLod = existingChunk.lod;
          existingChunk.lod = expectedLod;
          relodded.push(existingChunk);
        }
      }
    }

    // add new chunks
    const done = _spiral((dx, dz) => {
      const ax = ox + dx;
      const az = oz + dz;
      const index = _getChunkIndex(ax, az);

      if (!chunks[index]) {
        const chunk = new Chunk(
          ax,
          az,
          Math.max(Math.abs(dx), Math.abs(dz)) + 1
        );
        chunks[index] = chunk;
        added.push(chunk);

        updated = true;

        return false;
      } else {
        return true;
      }
    });

    // gc chunks index
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
      done,
    };
  }
}
const _getChunkIndex = (x, z) => (mod(x, 0xFFFF) << 16) | mod(z, 0xFFFF);

const _makeChunker = options => new Chunker(options);

module.exports = {
  makeChunker: _makeChunker,
};
