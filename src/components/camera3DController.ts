import { Mesh, UniversalCamera, Vector3 } from "@babylonjs/core"
import { Component } from "./component";
import { Player } from "../actors/player";
import { InputManager, Key } from "../inputManager";
import { LevelScene } from "../scenes/levelScene";

enum CameraMode {
    FPSMode,        // 
    TPSBehindMode,  //
    TPSAheadMode    //
}

export class Camera3DController implements Component {
    private tpsCamera: UniversalCamera;
    private fpsCamera: UniversalCamera;
    private kerby: Mesh;
    public currentCamera: CameraMode = 0;
    private scene: LevelScene;
    private tpsCameraCollider: Mesh;

    constructor(private targetEntity: Player, private input: InputManager) {
        this.scene = this.targetEntity.scene;
        this.kerby = this.targetEntity.meshRef;
        this.tpsCamera = new UniversalCamera("tpsCamera", Vector3.Zero(), this.scene);
        this.tpsCameraCollider = new Mesh("tpsCameraCollider", this.scene);
        this.tpsCameraCollider.checkCollisions = true;
        this.tpsCamera.parent = this.tpsCameraCollider;
        this.fpsCamera = new UniversalCamera("fpsCamera", this.targetEntity.position, this.scene);
        this.scene.activeCamera = this.fpsCamera;
        this.fpsCamera.minZ = this.tpsCamera.minZ = 0;
        this.changeActiveCamera(CameraMode.FPSMode); // set default camera to FPS
    }

    public get activeCamera() {
        return this.currentCamera ? this.tpsCamera : this.fpsCamera;
    }

    public set fov(newfov: number) {
        this.fpsCamera.fov = this.tpsCamera.fov = newfov;
    }

    public get fov() {
        return this.activeCamera.fov;
    }

    private changeActiveCamera(forceCameraMode?: CameraMode) {
        this.currentCamera = forceCameraMode ?? (this.currentCamera + 1) % 3;
        this.kerby.setEnabled(!!this.currentCamera);
        this.scene.activeCamera = this.activeCamera;
    }

    public beforeRenderUpdate(): void {
        if (this.input.inputMap[Key.Camera]) {
            this.changeActiveCamera();
            this.input.inputMap[Key.Camera] = false;
        }
        // update camera position and rotation based on the target entity
        switch (this.currentCamera) {
            case (CameraMode.FPSMode):
                this.fpsCamera.position = this.targetEntity.position;
                this.fpsCamera.rotation = this.targetEntity.rotation;
                break;
            case (CameraMode.TPSBehindMode):
                this.tpsCameraCollider.position = this.targetEntity.getForward().scale(-10).addInPlace(this.targetEntity.position);
                this.tpsCamera.rotation = this.targetEntity.rotation;
                break;
            case (CameraMode.TPSAheadMode):
                this.tpsCameraCollider.position = this.targetEntity.getForward().scale(10).addInPlace(this.targetEntity.position);
                this.tpsCamera.rotation = this.targetEntity.rotation.add(new Vector3(0, Math.PI, 0)).multiply(new Vector3(-1, 1, 0));
                break;
        }
    }

}