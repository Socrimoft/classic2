import { ComputeShader, Constants, DataBuffer, StorageBuffer, UniformBuffer, Vector3, WebGPUEngine } from "@babylonjs/core";
import chunkComputeShader from "./chunkCompute.wgsl";
import { blockTypeCount } from "../../voxel/block";
import { Chunk } from "../../voxel/chunk";

export class ChunkCompute extends ComputeShader {
    public static readonly VERTEX_STRUCT_SIZE = 12;

    private engine: WebGPUEngine;

    private uniforms: UniformBuffer;
    private vertexBuffer: StorageBuffer;
    private indexBuffer: StorageBuffer;
    public counterBuffer: StorageBuffer;
    private dispatchParamsBuffer: StorageBuffer;

    private workGroupSize: Vector3 = new Vector3(8, 8, 1);

    constructor(engine: WebGPUEngine) {
        super("chunkCompute", engine, { computeSource: chunkComputeShader }, {
            bindingsMapping:
            {
                "uniforms": { group: 0, binding: 0 },
                "chunkBuffer": { group: 0, binding: 1 },
                "vertexBuffer": { group: 0, binding: 2 },
                "indexBuffer": { group: 0, binding: 3 },
                "counterBuffer": { group: 0, binding: 4 },
            }
        });
        this.engine = engine;

        this.uniforms = new UniformBuffer(engine);

        this.uniforms.addUniform("chunkSize", 3);
        this.uniforms.addUniform("blockTypeCount", 1);

        this.uniforms.updateUInt3("chunkSize", Chunk.chunkSize.x, Chunk.chunkSize.y, Chunk.chunkSize.z);
        this.uniforms.updateUInt("blockTypeCount", blockTypeCount);

        this.uniforms.update();

        const maxFacesCount = Chunk.chunkSize.x * Chunk.chunkSize.y * Chunk.chunkSize.z * 6;

        const vertexBufferSize = (maxFacesCount * 4 * ChunkCompute.VERTEX_STRUCT_SIZE * 4) / 2;
        const indexBufferSize = (maxFacesCount * 2 * 3 * 4) / 2;

        this.vertexBuffer = new StorageBuffer(engine, vertexBufferSize, Constants.BUFFER_CREATIONFLAG_READWRITE); // faces * vertex * struct size * float
        this.indexBuffer = new StorageBuffer(engine, indexBufferSize, Constants.BUFFER_CREATIONFLAG_READWRITE); // faces * fragment * vertex * u32

        this.counterBuffer = new StorageBuffer(engine, 4, Constants.BUFFER_CREATIONFLAG_READWRITE); // u32

        this.dispatchParamsBuffer = new StorageBuffer(engine, 3 * 4, Constants.BUFFER_CREATIONFLAG_INDIRECT | Constants.BUFFER_CREATIONFLAG_READWRITE);
        this.dispatchParamsBuffer.update(new Uint32Array([Chunk.chunkSize.x / this.workGroupSize.x, Chunk.chunkSize.y / this.workGroupSize.y, Chunk.chunkSize.z / this.workGroupSize.z]));

        this.setUniformBuffer("uniforms", this.uniforms);
        this.setStorageBuffer("vertexBuffer", this.vertexBuffer);
        this.setStorageBuffer("indexBuffer", this.indexBuffer);
        this.setStorageBuffer("counterBuffer", this.counterBuffer);
    }

    public async updateGeometry(blocksBuffer: StorageBuffer) {
        this.setStorageBuffer("chunkBuffer", blocksBuffer);
        this.counterBuffer.update(new Uint32Array([0]), 0, 4);

        await this.waitForReady();
        this.dispatchIndirect(this.dispatchParamsBuffer);

        await this.engine._device.queue.onSubmittedWorkDone();
        const counterData: Uint32Array = new Uint32Array(1);
        await this.engine.readFromStorageBuffer(this.counterBuffer.getBuffer(), 0, 4, counterData, true)
        
        return counterData[0]; // faces count
    }

    // magouille
    public waitForReady(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isReady()) {
                resolve();
            }
            else {
                const checkReady = () => {
                    if (this.isReady()) {
                        this.engine.onEndFrameObservable.removeCallback(checkReady);
                        resolve();
                    }
                };
                this.engine.onEndFrameObservable.add(checkReady);
            }
        });
    }

    public getVertexBuffer(): DataBuffer {
        return this.vertexBuffer.getBuffer();
    }

    public getIndexBuffer(): DataBuffer {
        return this.indexBuffer.getBuffer();
    }
}
