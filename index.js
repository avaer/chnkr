class Chunk {
  constructor(x, z, lod) {
    this.x = x;
    this.z = z;
    this.lod = lod;

    this.data = null;
  }

  equals(chunk) {
    return this.x === chunk.x && this.z === chunk.z && this.lod === chunk.lod;
  }

  softEquals(chunk) {
    return this.x === chunk.x && this.z === chunk.z;
  }

  diffEquals(chunk) {
    return this.x === chunk.x && this.z === chunk.z && this.lod !== chunk.lod;
  }
}

class Chunker {
  constructor({resolution = 32, lods = 1} = {}) {
    this.resolution = resolution;
    this.lods = lods;

    this.chunks = [];
  }

  update(cx, cz) {
    const {resolution, lods, chunks} = this;

    const added = [];
    const removed = [];

    // find required chunks
    const requiredChunks = (() => {
      const result = [];

      const _addRequiredChunk = (dx, dz, lod) => {
        const chunk = new Chunk(
          Math.floor((cx + dx) / resolution),
          Math.floor((cz + dz) / resolution),
          lod
        );
        result.push(chunk);
      };

      for (let i = 1; i <= lods; i++) {
        const lod = i;

        // left
        for (let i = 0; i < (lod * 2) - 1; i++) {
          _addRequiredChunk(-(resolution / 2) - ((lod - 1) * resolution), -(resolution / 2) - ((lod - 1) * resolution) + (i * resolution), lod);
        }
        // front
        for (let i = 1; i <= (lod * 2) - 1; i++) {
          _addRequiredChunk(-(resolution / 2) - ((lod - 1) * resolution) + (i * resolution), -(resolution / 2) + -((lod - 1) * resolution), lod);
        }
        // right
        for (let i = 1; i <= (lod * 2) - 1; i++) {
          _addRequiredChunk((resolution / 2) + ((lod - 1) * resolution), -(resolution / 2) - ((lod - 1) * resolution) + (i * resolution), lod);
        }
        // back
        for (let i = 0; i < (lod * 2) - 1; i++) {
          _addRequiredChunk(-(resolution / 2) - ((lod - 1) * resolution) + (i * resolution), (resolution / 2) + ((lod - 1) * resolution), lod);
        }
      }
      return result;
    })();

    // remove outranged chunks
    const oldChunks = chunks.slice();
    chunks.length = 0;
    for (let i = 0; i < oldChunks.length; i++) {
      const chunk = oldChunks[i];

      if (requiredChunks.some(requiredChunk => requiredChunk.softEquals(chunk))) {
        chunks.push(chunk);
      } else {
        removed.push(chunk);
      }
    }

    // remove re-lodded chunks
    for (let i = 0; i < requiredChunks.length; i++) {
      const requiredChunk = requiredChunks[i];
      const throwOutConflictingChunkIndex = chunks.findIndex(chunk => chunk.diffEquals(requiredChunk));

      if (throwOutConflictingChunkIndex !== -1) {
        const throwOutConflictingChunk = chunks[throwOutConflictingChunkIndex];
        removed.push(throwOutConflictingChunk);
        chunks.splice(throwOutConflictingChunkIndex, 1);
      }
    }

    // add new chunks
    for (let i = 0; i < requiredChunks.length; i++) {
      const requiredChunk = requiredChunks[i];

      if (!chunks.some(chunk => chunk.softEquals(requiredChunk))) {
        added.push(requiredChunk);
        chunks.push(requiredChunk);
      }
    }

    return {
      added,
      removed,
    };
  }
}

const _makeChunker = options => new Chunker(options);

module.exports = {
  makeChunker: _makeChunker,
};
