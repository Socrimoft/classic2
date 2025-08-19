import { Color3, Color4, DirectionalLight, LoadAssetContainerAsync, Mesh, PBRMaterial, Scene, UniversalCamera, Vector3, WebGPUEngine } from "@babylonjs/core";
import { Game } from "../game";
import { ToonMaterial } from "../materials/toonMaterial";

/**
 * IntroScene class represents the intro of the game.
 * It extends the Scene class and load the intro glb if it has never load in the current session.
 * @extends Scene
 */
export class IntroScene extends Scene {

    constructor(engine: WebGPUEngine) {
        super(engine);
    }

    /**
     * Loads asynchronously the main menu scene by setting up the environment, lights, camera, and UI elements.
     * @returns A promise that resolves when the scene is fully loaded.
     */
    public async load(): Promise<void> {
        this.clearColor = new Color4(0.8, 0.9, 1, 1);
        const light = new DirectionalLight("dirLight", new Vector3(0, 1, 1), this);
        light.intensity = 0.8;
        light.diffuse = new Color3(1, 0.95, 0.8);

        if (sessionStorage.getItem("isFirstLoading") == null) {
            const container = await LoadAssetContainerAsync("./assets/models/kerby_menuscene.glb", this);
            const root = (container.rootNodes.length == 1 && container.rootNodes[0] instanceof Mesh) ? container.rootNodes[0] : container.createRootMesh();
            root.name = "kerby_menuscene";

            sessionStorage.setItem("isFirstLoading", "1");

            container.meshes.forEach((mesh) => {
                if (!mesh.name.includes("Text") && !mesh.name.includes("Plane") && container && container.textures[0])
                    mesh.material = new ToonMaterial(root.name + "Material", container.textures[0], this);
                if (container && mesh.material && mesh.material instanceof PBRMaterial)
                    mesh.material = new ToonMaterial(root.name + "Material", mesh.material.albedoColor, this);
            });

            container.addAllToScene();

            const camera = this.getCameraByName("Camera");
            if (camera)
                this.activeCamera = camera;

            const camAnim = container.animationGroups.find(ag => ag.name.toLowerCase().includes("camera"));
            const kerbyAnim = container.animationGroups.find(ag => ag.name.toLowerCase().includes("kirby"));
            const text1Anim = container.animationGroups.find(ag => ag.name.toLowerCase().includes("text.001"));
            const text2Anim = container.animationGroups.find(ag => ag.name.toLowerCase().includes("text.008"));

            camAnim?.play(false);
            kerbyAnim?.play(false);
            text1Anim?.play(false);
            text2Anim?.play(false);
            kerbyAnim?.onAnimationEndObservable.add(() => this.switchMainMenuScene(), undefined, true, undefined, true);
        } else {
            new UniversalCamera("Camera", new Vector3(0, 1, -10), this);
            console.log("Intro scene already loaded, switching to main menu directly.");
            return await this.switchMainMenuScene();
        }
    }

    /**
     * Switches to the mainMenu
     */
    private async switchMainMenuScene() {
        this.detachControl();
        await Game.Instance.switchToMainMenu();
        this.dispose();
    }
}
