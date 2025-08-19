import { Constants, DataBuffer, Mesh, Nullable, Vector2, Vector3, VertexBuffer, WebGPUEngine } from "@babylonjs/core";
import { Block, blockList, BlockType, blockTypeList } from "./block";
import { LevelScene } from "../scenes/levelScene";
import { ChunkCompute } from "../compute_shaders/chunk/chunkCompute";

export class Chunk extends Mesh {
    static readonly chunkSize = new Vector3(16, 256, 16);
    static readonly blockCount = this.chunkSize.x * this.chunkSize.y * this.chunkSize.z;
    public blocks = new Uint32Array(Chunk.blockCount);
    static worldtype: { type: "flat"; map: (keyof typeof blockList)[] } | { type: "normal" };
    public ready = false;
    private static _debugChunk: Nullable<Chunk> = null;

    public vertexBuffer?: DataBuffer;
    public indexBuffer?: DataBuffer;

    constructor(private coord: Vector2, public scene: LevelScene) {
        super(`${coord.x}_${coord.y}`, scene);

        this.position = new Vector3(coord.x * Chunk.chunkSize.x, 0, coord.y * Chunk.chunkSize.z);

        this.material = Block.generateMaterial(scene);

        // cause flickering
        //this.occlusionType = Mesh.OCCLUSION_TYPE_STRICT;
        //this.occlusionQueryAlgorithmType = Mesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE;

        // const axes = new AxesViewer(scene, 3);
        // axes.xAxis.parent = this;
        // axes.yAxis.parent = this;
        // axes.zAxis.parent = this;
        this.checkCollisions = true;
        this.receiveShadows = true;
    }

    public getBlockU32Index(position: Vector3) {
        return (position.x + position.y * Chunk.chunkSize.x + position.z * Chunk.chunkSize.x * Chunk.chunkSize.y);
    }

    public getBlock(position: Vector3): number {
        return this.blocks[this.getBlockU32Index(position)];
    }

    public setBlock(position: Vector3, type: number): void {
        // Set a block to the chunk at the given position
        // The position should be in chunk coordinates
        const x = position.x;
        const y = position.y;
        const z = position.z;

        // Check if the position is within the chunk bounds
        if (x < 0 || x >= Chunk.chunkSize.x || y < 0 || y >= Chunk.chunkSize.y || z < 0 || z >= Chunk.chunkSize.z) {
            throw new Error(`Position ${position} is out of chunk bounds`);
        }
        const u32Index = this.getBlockU32Index(position);
        this.blocks[u32Index] = type;
    }

    public popBlock(position: Vector3): number | null {
        const block = this.getBlock(position);
        if (block) {
            this.setBlock(position, 0);
            return block;
        }
        return null;
    }

    getHighestBlock(x: number, z: number): number {
        let y = Chunk.chunkSize.y - 1;
        while (y > 0 && !this.getBlock(new Vector3(x, y, z))) {
            y--;
        }
        return y;
    }

    public get3DChunkCoord(): Vector3 {
        return this.position;
    }

    public setupBuffers(facesCount: number, vertexBuffer: DataBuffer, indexBuffer: DataBuffer) {
        this.destroyBuffers();

        const totalVertices = facesCount * 4;
        const totalIndices = facesCount * 2 * 3;

        const vertexBufferSize = totalVertices * ChunkCompute.VERTEX_STRUCT_SIZE * 4;
        const indexBufferSize = totalIndices * 4;

        const webGpuEngine: WebGPUEngine = this.scene.getEngine() as WebGPUEngine;
        this.vertexBuffer = webGpuEngine._createBuffer(vertexBufferSize, Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE);
        this.indexBuffer = webGpuEngine._createBuffer(indexBufferSize, Constants.BUFFER_CREATIONFLAG_INDEX | Constants.BUFFER_CREATIONFLAG_READWRITE);

        webGpuEngine._renderEncoder.copyBufferToBuffer(vertexBuffer.underlyingResource, 0, this.vertexBuffer.underlyingResource, 0, vertexBufferSize);
        webGpuEngine._renderEncoder.copyBufferToBuffer(indexBuffer.underlyingResource, 0, this.indexBuffer.underlyingResource, 0, indexBufferSize);

        this.setVerticesBuffer(new VertexBuffer(this.scene.getEngine(), this.vertexBuffer, VertexBuffer.PositionKind, true, false, 48, false, 0, 3, VertexBuffer.FLOAT, true, true));
        this.setVerticesBuffer(new VertexBuffer(this.scene.getEngine(), this.vertexBuffer, VertexBuffer.NormalKind, true, false, 48, false, 16, 3, VertexBuffer.FLOAT, true, true));
        this.setVerticesBuffer(new VertexBuffer(this.scene.getEngine(), this.vertexBuffer, VertexBuffer.UVKind, true, false, 48, false, 32, 2, VertexBuffer.FLOAT, true, true));

        this.setIndexBuffer(this.indexBuffer, totalVertices, totalIndices, true);

        this.refreshBoundingInfo();
        this.ready = true;
    }

    private destroyBuffers() {
        if (this.vertexBuffer)
            (this.vertexBuffer.underlyingResource as GPUBuffer).destroy();
        if (this.indexBuffer)
            (this.indexBuffer.underlyingResource as GPUBuffer).destroy();
        this.vertexBuffer = undefined;
        this.indexBuffer = undefined;
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        this.geometry?.clearCachedData();
        (this.scene.getEngine() as WebGPUEngine)._device.queue.onSubmittedWorkDone().then(() => this.destroyBuffers());
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
