import { Color3, Color4, DynamicTexture, Engine, Texture } from "@babylonjs/core";
import { LevelScene } from "../scenes/levelScene";
import blocks from "./blocks.json";
import { ToonMaterial } from "../materials/toonMaterial";

export { blocks };
export const notaBlockList = Object.keys(blocks.notABlock) as (keyof typeof blocks.notABlock)[];
export const blockList = { ...blocks.sediment, ...blocks.wood, ...blocks.ore, ...blocks.other } as const;
export const blockTypeList = ["air", ...Object.keys(blockList)] as (keyof typeof blockList | "air")[];
export const blockTypeCount = blockTypeList.length;

export const BlockType = Object.fromEntries(
    blockTypeList.map((name, index) => [name, index])
) as { [K in typeof blockTypeList[number]]: number };

export type BlockType = keyof typeof BlockType;

export class Block {
    private static readonly rootURI = "./assets/images/world/blocks/";
    private static atlas: DynamicTexture;
    private static waterStill: DynamicTexture;
    private static waterFlow: DynamicTexture;
    private static _waterAnim: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 = 0;
    private static atlasMaterial: ToonMaterial;
    public static tileSize = 32;
    public static size = 1;
    /*
        public static readonly faceUV = [
            // x+ y+ z+
            // x- y- z-
            new Vector4(2 / 3, 0.5, 1, 1),      // side 0 faces the positive z direction = left face
            new Vector4(2 / 3, 0, 1, 0.5),      // side 1 faces the negative z direction = right face
            new Vector4(0, 0.5, 1 / 3, 1),      // side 2 faces the positive x direction = front face
            new Vector4(0, 0, 1 / 3, 0.5),      // side 3 faces the negative x direction = back face
            new Vector4(1 / 3, 0.5, 2 / 3, 1),  // side 4 faces the positive y direction = top face
            new Vector4(1 / 3, 0, 2 / 3, 0.5),  // side 5 faces the negative y direction = bottom face
        ];
    */
    public static generateMaterial(scene: LevelScene): ToonMaterial {
        if (!this.atlasMaterial) {

            this.atlasMaterial = new ToonMaterial("block_atlas_material", this.generateTextureAtlas(scene), scene);
        }
        return this.atlasMaterial;
    }

    public static async addImageToAtlas(imgUrl: string, index: number, dy: number, color: Color4) {
        if (imgUrl.endsWith("water.png")) {
            return Promise.resolve(); // Skip water images because wateratlas is probably nor ready
        }
        let image = new Image();
        image.src = imgUrl;
        return new Promise<void>((resolve) => {
            image.onload = () => {
                const dx = index * this.tileSize;
                this.atlas.getContext().drawImage(image, dx, dy, this.tileSize, this.tileSize); // Adjust placement on canvas

                const imageData = this.atlas.getContext().getImageData(dx, dy, this.tileSize, this.tileSize);

                for (let j = 0; j < imageData.data.length; j += 4) {
                    imageData.data[j] *= color.r;
                    imageData.data[j + 1] *= color.g;
                    imageData.data[j + 2] *= color.b;
                }
                this.atlas.getContext().putImageData(imageData, dx, dy);
                resolve();
            };
        });
    }

    public static generateTextureAtlas(scene: LevelScene): DynamicTexture {
        // make texture atlas
        if (this.atlas) {
            return this.atlas;
        }
        // generate water textures
        let filelist = ["water_still.png", "water_flow.png"];
        ["waterStill", "waterFlow"].map((name) => {
            let canvas = document.createElement("canvas");
            canvas.width = this.tileSize;
            canvas.height = 32 * this.tileSize;
            canvas.getContext("2d", { willReadFrequently: true })
            return this[name] = new DynamicTexture(name, canvas, scene, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTUREFORMAT_RGBA);
        }).forEach((texture, index) => {
            texture.hasAlpha = true;
            let image = new Image();
            image.src = Block.rootURI + filelist[index];
            image.onload = () => {
                texture.getContext().drawImage(image, 0, 0); // Adjust placement on canvas
                const imageData: ImageData = texture.getContext().getImageData(0, 0, this.tileSize, 32 * this.tileSize);

                const color = this.getFaceColors("water");
                for (let j = 0; j < imageData.data.length; j += 4) {

                    imageData.data[j] *= color[0].r;
                    imageData.data[j + 1] *= color[0].g;
                    imageData.data[j + 2] *= color[0].b;
                }
                texture.getContext().putImageData(imageData, 0, 0);
                texture.update(undefined, undefined, true);
            };
        });
        let canvas = document.createElement("canvas");
        canvas.width = this.tileSize * 6;
        canvas.height = this.tileSize * blockTypeCount;
        canvas.getContext("2d", { willReadFrequently: true })
        this.atlas = new DynamicTexture("block_atlas", canvas, scene, true, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTUREFORMAT_RGBA);
        this.atlas.hasAlpha = true;
        const imageresult: Promise<void>[] = [];
        for (let i = 1; i < blockTypeCount; i++) {
            const filelist: string[] = blockList[blockTypeList[i]];
            const color = this.getFaceColors(blockTypeList[i]);

            const dy = i * this.tileSize;
            // Draw each image onto the canvas
            imageresult.push(...filelist.map(file => Block.rootURI + file).map((imgUrl: string, index: number) => this.addImageToAtlas(imgUrl, index, dy, color[index])));
        }
        Promise.allSettled(imageresult).then(() => {
            this.updatewaterTexture();
            this.atlas.update(undefined, undefined, true);
        });

        // for (const key of notaBlockList) {
        //     const texture = new Texture(this.rootURI + blocks.notABlock[key][0], Block.scene, undefined, undefined, Texture.NEAREST_NEAREST);
        //     texture.hasAlpha = true;
        //     buffer[key] = new ToonMaterial(key + "Material", texture, Block.scene);
        // }

        return this.atlas;
    }

    public static updatewaterTexture() {
        const waterIndex = blockTypeList.indexOf("water");
        const flowData = this.waterFlow.getContext().getImageData(0, this._waterAnim * this.tileSize, this.tileSize, this.tileSize);
        const stillData = this.waterStill.getContext().getImageData(0, this._waterAnim * this.tileSize, this.tileSize, this.tileSize);
        const context = this.atlas.getContext();
        [0, 1, 2, 3, 4, 5].forEach((i) => context.putImageData(i != 2 && i != 3 ? flowData : stillData, i * this.tileSize, waterIndex * this.tileSize));
        this.atlas.update(undefined, undefined, true);
        this._waterAnim++;
        if (this._waterAnim > 31) {
            this._waterAnim = 0;
        }
    }

    public static getTextureAtlas(): DynamicTexture {
        return this.atlas;
    }

    public static getBlockTypeFromId(id: number): BlockType {
        return blockTypeList[id];
    }

    public static getFaceColors(key: BlockType): Array<Color4> {
        // add color to greyed faces
        switch (key) {
            case "oak_leaves":
                return [
                    new Color4(0, 0.48, 0, 1), // +X
                    new Color4(0, 0.48, 0, 1), // -X
                    new Color4(0, 0.48, 0, 1), // +Y
                    new Color4(0, 0.48, 0, 1), // -Y
                    new Color4(0, 0.48, 0, 1), // +Z
                    new Color4(0, 0.48, 0, 1), // -Z
                ];
            case "grass_block":
                return [
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(0.48, 0.74, 0.42, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                ];
            case "water":
                return [
                    new Color4(0, 0.48, 0.74, 1),
                    new Color4(0, 0.48, 0.74, 1),
                    new Color4(0, 0.48, 0.74, 1),
                    new Color4(0, 0.48, 0.74, 1),
                    new Color4(0, 0.48, 0.74, 1),
                    new Color4(0, 0.48, 0.74, 1),
                ];
            default:
                return [
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                    new Color4(1, 1, 1, 1),
                ];
        }
    }

    // static makeRuntimeMeshBuffer() {
    //     for (const key of notaBlockList) {
    //         const face1 = MeshBuilder.CreatePlane(key + "_1", { size: Block.size, sideOrientation: Mesh.DOUBLESIDE }, Block.scene);
    //         face1.rotation.y = 3 * Math.PI / 4;
    //         face1.material = this.runtimeMaterialBuffer[key];

    //         const face2 = MeshBuilder.CreatePlane(key + "_2", { size: Block.size, sideOrientation: Mesh.DOUBLESIDE }, Block.scene);
    //         face2.rotation.y = Math.PI / 4;
    //         face2.material = this.runtimeMaterialBuffer[key];

    //         // make a root node
    //         const root = Mesh.MergeMeshes([face1, face2])!;
    //         root.setEnabled(false);
    //         root.checkCollisions = false;
    //         buffer[key] = root;
    //     }
    //     this.runtimeMeshBuffer = buffer;
    // }
}
