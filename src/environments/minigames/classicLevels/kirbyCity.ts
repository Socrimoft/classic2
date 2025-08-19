import { Color3, CubeTexture, DirectionalLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Environment } from "../../environment";
import { GlbMapManager } from "../../../actors/GlbMapManager";

export class KirCity extends Environment {

    setupSkybox(): void {
        this.skybox.position = new Vector3(0, this.skyboxSize / 8, 0);
        const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("./assets/images/bird/skybox/", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.infiniteDistance = true;
    }

    setupLight(): void {
        const light = new DirectionalLight("dirLight", new Vector3(1, -1, 1), this.scene);
    }

    async loadEnvironment() {
        const cityMap = new GlbMapManager("cityMap", this.scene);
        await cityMap.instanciate(new Vector3(0, 0, 0), new Vector3(0, 0, 0));

    }

    beforeRenderUpdate(): void {
    }
}