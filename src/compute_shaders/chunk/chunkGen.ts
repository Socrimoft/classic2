import { Constants, DataBuffer, StorageBuffer, UniformBuffer, WebGPUEngine } from "@babylonjs/core";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import chunkGenSource from "./chunkGen.wgsl";
import { Chunk } from "../../voxel/chunk";
import { BlockType } from "../../voxel/block";

export class ChunkGen extends ComputeShader {
    private uniformsBuffer: UniformBuffer;
    private dispatchParamsBuffer: StorageBuffer;
    private blockBuffer: StorageBuffer;
    private flatWorldInfoBuffer: StorageBuffer;
    private _worldType: { type: "flat"; map: (keyof typeof BlockType)[]; } | { type: "normal"; };
    testBuf: StorageBuffer;
    constructor(private engine: WebGPUEngine, private seed: number) {
        super("chunkGen", engine, { computeSource: chunkGenSource }, {
            bindingsMapping: {
                "uniforms": { group: 0, binding: 0 },
                "blockBuffer": { group: 0, binding: 1 },
                "flatWorldInfoBuffer": { group: 0, binding: 2 },
                "buf": { group: 0, binding: 3 },
            }
        });
        this.uniformsBuffer = new UniformBuffer(this.engine);
        this.uniformsBuffer.addUniform("seed", 1);
        this.uniformsBuffer.addUniform("chunkSize", 3);
        this.uniformsBuffer.addUniform("chunkCoord", 2);
        this.uniformsBuffer.addUniform("worldType", 1);

        this.uniformsBuffer.updateInt("seed", this.seed);
        this.uniformsBuffer.updateUInt3("chunkSize", Chunk.chunkSize.x, Chunk.chunkSize.y, Chunk.chunkSize.z);
        this.uniformsBuffer.updateInt2("chunkCoord", 0, 0);
        this.uniformsBuffer.updateUInt("worldType", 0);

        this.uniformsBuffer.update();
        this.setUniformBuffer("uniforms", this.uniformsBuffer);

        this._worldType = { type: "normal" };
        this.flatWorldInfoBuffer = new StorageBuffer(this.engine, Chunk.chunkSize.y * 4 / 2, Constants.BUFFER_CREATIONFLAG_READWRITE);
        this.setStorageBuffer("flatWorldInfoBuffer", this.flatWorldInfoBuffer);

        this.blockBuffer = new StorageBuffer(this.engine, Chunk.blockCount * 4, Constants.BUFFER_CREATIONFLAG_READWRITE);
        this.setStorageBuffer("blockBuffer", this.blockBuffer);

        this.testBuf = new StorageBuffer(this.engine, Chunk.blockCount * 4, Constants.BUFFER_CREATIONFLAG_READWRITE);
        this.setStorageBuffer("buf", this.testBuf);

        this.dispatchParamsBuffer = new StorageBuffer(this.engine, 3 * 4, Constants.BUFFER_CREATIONFLAG_INDIRECT | Constants.BUFFER_CREATIONFLAG_READWRITE);
        this.dispatchParamsBuffer.update(new Uint32Array([1, 1, 1]));
    }

    public set worldType(worldtype: { type: "flat"; map: (keyof typeof BlockType)[] } | { type: "normal" }) {
        this._worldType = worldtype;

        this.uniformsBuffer.updateUInt("worldType", (worldtype.type === "normal") ? 1 : 0);
        this.uniformsBuffer.update();

        const flatWorldInfo = new Uint32Array(Chunk.chunkSize.y / 2);

        if (worldtype.type === "flat")
            worldtype.map.forEach((block, i) => {
                const index = Math.floor(i / 2);
                if (i % 2 === 0)
                    flatWorldInfo[index] |= BlockType[block] & 0xFFFF;
                else
                    flatWorldInfo[index] |= (BlockType[block] & 0xFFFF) << 16;
            });
        this.flatWorldInfoBuffer.update(flatWorldInfo);
    }
    public get worldType(): { type: "flat"; map: (keyof typeof BlockType)[] } | { type: "normal" } {
        return this._worldType;
    }

    public async generateChunk(chunk: Chunk): Promise<StorageBuffer> {
        this.blockBuffer.update(chunk.blocks);
        this.uniformsBuffer.updateInt2("chunkCoord", chunk.position.x / Chunk.chunkSize.x, chunk.position.z / Chunk.chunkSize.z);
        this.uniformsBuffer.update();
        if (chunk.blocks[0] !== BlockType.bedrock) {
            await this.waitForReady();
            this.dispatchIndirect(this.dispatchParamsBuffer);
        }
        await this.engine._device.queue.onSubmittedWorkDone();
        //console.log("testBuf", chunk.position.x / Chunk.chunkSize.x, chunk.position.z / Chunk.chunkSize.z, this.testBuf.getBuffer());
        return this.blockBuffer;
    }
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
}