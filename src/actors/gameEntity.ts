import { AbstractMesh, AnimationGroup, AssetContainer, AxesViewer, DirectionalLight, LoadAssetContainerAsync, Matrix, Mesh, MeshBuilder, PBRMaterial, ShaderMaterial, StandardMaterial, Vector3 } from "@babylonjs/core";
import { LevelScene } from "../scenes/levelScene";
import { Component } from "../components/component";
import { ToonMaterial } from "../materials/toonMaterial";

/**
 * Generic class for game entities.\
 * This class is used to create and manage game entities within minigames.\
 * It handles instantiation, cloning, animation registration, and component management.\
 * It also provides methods for mesh manipulation and collision handling.\
 * It is designed to be extended by specific game entities, such as players or enemies.\
 */
export class GameEntity {
    public scene: LevelScene;
    public name: string;
    private assets?: AssetContainer;
    protected mesh?: Mesh;
    public animations: Record<string, AnimationGroup> = {};
    public components: Array<Component> = [];
    public baseSourceURI = "./assets/models/";
    private boundfct?: () => void;
    public isDisposed = false;

    constructor(name: string, scene: LevelScene, ...components: Component[]) {
        this.scene = scene;
        this.name = name;
        this.components.push(...components);
    }

    public async instanciate(position = Vector3.Zero(), rotation = Vector3.Zero()): Promise<void> {
        this.assets = await LoadAssetContainerAsync(this.baseSourceURI + this.name + ".glb", this.scene);
        const root = (this.assets.rootNodes.length == 1 && this.assets.rootNodes[0] instanceof Mesh) ? this.assets.rootNodes[0] : this.assets.createRootMesh();
        root.name = this.name;

        console.log(root.getBoundingInfo().boundingBox.minimum.y);

        // debug
        // const axes = new AxesViewer(this.scene, 1);
        // axes.xAxis.parent = root;
        // axes.yAxis.parent = root;
        // axes.zAxis.parent = root;

        // const debugBox = MeshBuilder.CreateBox("debugBox", { size: 1 }, this.scene);
        // debugBox.parent = root;
        // debugBox.isVisible = true;
        // debugBox.material = new StandardMaterial("debugMat", this.scene);
        // debugBox.material.wireframe = true;


        this.assets.meshes.forEach((mesh) => {
            if (this.assets && this.assets.textures[0])
                mesh.material = new ToonMaterial(this.name + "Material", this.assets.textures[0], this.scene);
            else if (this.assets && mesh.material && mesh.material instanceof StandardMaterial)
                mesh.material = new ToonMaterial(this.name + "Material", mesh.material.diffuseColor, this.scene);
            else if (this.assets && mesh.material && mesh.material instanceof PBRMaterial)
                mesh.material = new ToonMaterial(this.name + "Material", mesh.material.albedoColor, this.scene);
        });

        this.assets.addAllToScene();

        if (this.mesh) this.dispose();
        this.mesh = root;
        this.isDisposed = false;
        this.mesh.position = position;
        this.mesh.rotation = rotation;
    }

    public clone(name?: string, position?: Vector3, rotation?: Vector3, cloneComponents: boolean = false): GameEntity {
        if (!this.assets)
            throw new Error("Unable to clone a non-instantiated GameEntity");

        const clonedEntity = cloneComponents ? new GameEntity(name ? name : this.name, this.scene, ...this.components) : new GameEntity(this.name, this.scene);

        const entries = this.assets.instantiateModelsToScene(undefined, true, { doNotInstantiate: true });
        clonedEntity.assets = this.assets;
        clonedEntity.mesh = (entries.rootNodes[0] as Mesh);

        if (position) clonedEntity.mesh.position = position;
        if (rotation) clonedEntity.mesh.rotation = rotation;

        return clonedEntity;
    }

    public dispose() {
        if (this.mesh) this.mesh.dispose();
        if (this.boundfct)
            this.scene.unregisterBeforeRender(this.boundfct)
        this.isDisposed = true;
    }

    public registerAnimations(names: string[]): void {
        if (!this.assets)
            throw new Error("Unable to register animations of a non-instantiated GameEntity");

        for (const name of names) {
            const anim = this.assets.animationGroups.find(ag => name === ag.name);

            if (!anim)
                throw new Error(name + " animation not found");

            this.animations[name] = anim;
        }
    }

    public getAnimByName(name: string) {
        if (!this.animations[name])
            throw new Error("Cannot return the unregistered animation: " + name);
        return this.animations[name];
    }

    public stopAllAnims(): void {
        Object.values(this.animations).forEach(ag => ag.stop());
    }

    public addComponent(component: Component) {
        this.components.push(component)
    }

    public activateEntityComponents(): void {
        this.boundfct = this.beforeRenderUpdate.bind(this)
        this.scene.registerBeforeRender(this.boundfct);
    }
    private beforeRenderUpdate() {
        this.components.forEach((comp) => { comp.beforeRenderUpdate() })
    }

    public get position(): Vector3 {
        return this.mesh ? this.mesh.position : Vector3.Zero();
    }

    public set position(position: Vector3) {
        if (this.mesh) this.mesh.position = position;
    }

    public get rotation(): Vector3 {
        return this.mesh ? this.mesh.rotation : Vector3.Zero();
    }

    public set rotation(rotation: Vector3) {
        if (this.mesh) this.mesh.rotation = rotation;
    }

    public getForward(): Vector3 {
        return this.mesh ? this.mesh.forward : Vector3.Zero();
    }

    public isSameMesh(otherMesh: AbstractMesh): boolean {
        return this.mesh ? this.mesh == otherMesh : false;
    }

    public moveWithCollisions(displacement: Vector3): void {
        if (this.mesh) this.mesh.moveWithCollisions(displacement);
    }

    public moveForwardWithCollisions(scale: number): void {
        if (this.mesh) this.moveWithCollisions(this.mesh.forward.scale(scale));
    }

    /** 
     * this is probably not the good way to do what you want to do, considering you're using this.
     * make a new method that do what you want instead of using this
    */
    public get meshRef() {
        return this.mesh as Mesh;
    }

    public updateShaderLightDirection(direction: Vector3) {
        if (!this.mesh) return;

        this.mesh.getChildMeshes().forEach(mesh => {
            if (mesh.material && mesh.material instanceof ShaderMaterial) {
                mesh.material.setVector3("lightDirection", direction);
            }
        });
    }
}
