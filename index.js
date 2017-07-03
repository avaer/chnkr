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
  constructor({resolution = 32, range = 1} = {}) {
    this.resolution = resolution;
    this.range = range;

    this.chunks = [];
  }

  update(cx, cz) {
    const {resolution, range, chunks} = this;

    const added = [];
    const removed = [];
    const relodded = [];

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

      for (let radius = 1; radius <= range; radius++) {
        const baseDistance = (resolution / 2) + ((radius - 1) * resolution);

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
      const conflictingChunk = chunks.find(chunk => chunk.diffEquals(requiredChunk));

      if (conflictingChunk) {
        conflictingChunk.lod = requiredChunk.lod;
        relodded.push(conflictingChunk);
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
      relodded,
    };
  }
}

const _makeChunker = options => new Chunker(options);

module.exports = {
  makeChunker: _makeChunker,
};
