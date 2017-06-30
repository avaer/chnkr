const DIAGONAL_DIRECTIONS = [
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, -1],
];

class Chunk {
  constructor(x, z, lod) {
    this.x = x;
    this.z = z;
    this.lod = lod;
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
      for (let i = 0; i < lods; i++) {
        const lod = i;
        const lodRange = (resolution / 2) + ((lod - 1) * resolution);

        const lodRequiredChunks = DIAGONAL_DIRECTIONS.map(([dx, dz]) => new Chunk(
          Math.floor((cx + (dx * lodRange)) / resolution),
          Math.floor((cz + (dz * lodRange)) / resolution),
          lod
        ));
        result.push.apply(result, lodRequiredChunks);
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
