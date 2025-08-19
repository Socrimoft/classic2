import { BaseTexture, Color3, DirectionalLight, DynamicTexture, IShadowGenerator, Material, Nullable, Scene, ShaderLanguage, ShaderMaterial, StorageBuffer, Vector4, WebGPUEngine } from "@babylonjs/core";

enum LightOffsets {
    DIFFUSE_R = 0,
    DIFFUSE_G = 1,
    DIFFUSE_B = 2,
    INTENSITY = 3,
    DIRECTION_X = 4,
    DIRECTION_Y = 5,
    DIRECTION_Z = 6,
}
const FLOATS_PER_LIGHT = 7;

const MIN_BUFFER_SIZE = 32;

/**
 * ToonMaterial is a custom shader material for rendering objects with a toon shading effect.\
 * It supports directional lights, texture or color input, and various material properties.\
 * It also handles shadow mapping if a shadow generator is present in the scene. (wip)
 * 
 */
export class ToonMaterial extends ShaderMaterial {
    private directionalLights: Array<DirectionalLight>;
    private prevLightData: Float32Array;
    public lightsBuffer: StorageBuffer;

    constructor(name: string, textureOrColor: BaseTexture | Color3, scene: Scene) {
        super(name, scene,
            {
                vertex: "toon",
                fragment: "toon"
            },
            {
                attributes: ["position", "normal", "uv"],
                uniformBuffers: ["Scene", "Mesh"],
                shaderLanguage: ShaderLanguage.WGSL,
            });

        this.directionalLights = scene.lights.filter(light => light instanceof DirectionalLight);

        const bufferSize = this.directionalLights.length * FLOATS_PER_LIGHT * 4;
        this.lightsBuffer = new StorageBuffer(scene.getEngine() as WebGPUEngine, bufferSize < MIN_BUFFER_SIZE ? MIN_BUFFER_SIZE : bufferSize);

        if (textureOrColor instanceof Color3) {
            const size = 512;
            const dynamicTexture = new DynamicTexture("dynamicTexture", size, scene);
            const ctx = dynamicTexture.getContext();

            ctx.fillStyle = textureOrColor.toHexString();
            ctx.fillRect(0, 0, size, size);

            dynamicTexture.update();
            textureOrColor = dynamicTexture;
        }
        else if (textureOrColor.hasAlpha) {
            this.transparencyMode = Material.MATERIAL_ALPHABLEND;
        }

        this.needDepthPrePass = true;

        this.prevLightData = this.computeLightData();
        this.updateLightsBuffer(this.prevLightData);

        this.setStorageBuffer("lights", this.lightsBuffer);
        this.setTexture("texture", textureOrColor);
        this.setVector4("ambiantColor", new Vector4(0.5, 0.5, 0.5, 1.0));
        this.setVector4("specularColor", new Vector4(0.9, 0.9, 0.9, 1.0));
        this.setFloat("glossiness", 32);
        this.setVector4("rimColor", new Vector4(1, 1, 1, 1));
        this.setFloat("rimAmount", 0.716);
        this.setFloat("rimThreshold", 0.1);


        let shadowGenerator: Nullable<IShadowGenerator> = null;
        if (scene.lights[0])
            shadowGenerator = scene.lights[0].getShadowGenerator();
        console.log(shadowGenerator);
        if (shadowGenerator) {
            console.log("shadow");
            this.setTexture("shadowMap", shadowGenerator.getShadowMap() as BaseTexture);
            console.log(shadowGenerator.getShadowMap());
            this.setMatrix("transformShadowMatrix", shadowGenerator.getTransformMatrix());
            this.setDefine("SHADOWS", true);
        }

        scene.onBeforeRenderObservable.add(() => {
            const currentData = this.computeLightData();
            if (!this.compareLightData(this.prevLightData, currentData)) {
                this.updateLightsBuffer(currentData);
                this.prevLightData = currentData;
            }
        });
    }
    
    /**
     * Computes the light data for all directional lights in the scene.\
     * @returns light data for all directional lights.\
     */
    private computeLightData(): Float32Array {
        const data = new Float32Array(this.directionalLights.length * FLOATS_PER_LIGHT);
        this.directionalLights.forEach((light, index) => {
            const offset = index * FLOATS_PER_LIGHT;


            // diffuse (12 bytes)
            data[offset + LightOffsets.DIFFUSE_R] = light.diffuse.r;
            data[offset + LightOffsets.DIFFUSE_G] = light.diffuse.g;
            data[offset + LightOffsets.DIFFUSE_B] = light.diffuse.b;

            // intensity (4 bytes)
            data[offset + LightOffsets.INTENSITY] = light.intensity;

            // direction (12 bytes)
            data[offset + LightOffsets.DIRECTION_X] = light.direction.x;
            data[offset + LightOffsets.DIRECTION_Y] = light.direction.y;
            data[offset + LightOffsets.DIRECTION_Z] = light.direction.z;
        });
        return data;
    }

    private compareLightData(l1: Float32Array, l2: Float32Array): boolean {
        if (l1.length !== l2.length) return false;
        for (let i = 0; i < l1.length; i++)
            if (l1[i] !== l2[i]) return false;
        return true;
    }

    public updateLightsBuffer(data: Float32Array) {
        const buffer = new ArrayBuffer(data.byteLength);
        const view = new DataView(buffer);
        data.forEach((val, i) => view.setFloat32(i * 4, val, true));
        this.lightsBuffer.update(view);
    }

    public useVertexColors() {
        this.setDefine("USE_VERTEX_COLORS", true);
    }
}
