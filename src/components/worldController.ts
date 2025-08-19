import { Color4, Nullable, Ray, Vector3, AbstractMesh, PickingInfo, Tools, Logger } from "@babylonjs/core";
import { InputManager, Key } from "../inputManager";
import { EntityController } from "./entityController";
import { Player } from "../actors/player";
import { Block } from "../voxel/block";
import { WorldGui } from "../gui/worldGui";
import { Game } from "../game";

export class WorldController extends EntityController {
    private input: InputManager;
    private mouseSensibilityX = 0.001;
    private mouseSensibilityY = 0.001;
    private blockPickRange = 4; // 
    private blockPicked: Nullable<Block> = null;
    protected linearSpeed = 5;     // ?blocks/s
    private gui: WorldGui;
    public creative: boolean = true; // if true, player can fly and has no gravity
    private oldHitMesh: Nullable<AbstractMesh> = null;

    constructor(player: Player, input: InputManager) {
        super(player)

        this.input = input;
        this.entity.stopAllAnims();
        this.playAnimation(Player.Animation.Idle);
        globalThis.input = input; // for debugging purposes
        input.isWorldPlaying = true;
        player.meshRef.scaling = new Vector3(0.7, 0.7, 0.7);

        this.gui = new WorldGui(player.scene);
        this.gui.makePauseMenu(() => {
            this.input.isWorldPlaying = true;
            Game.Instance.audio.resume();
        });

        globalThis.gui = this.gui; // for debugging purposes
    }

    private jumpBeforeRender(deltaTime: number) {
        if (this.creative == false) {
            // jump if jump's key is pressed and not already jumping
            if (this.input.inputMap[Key.Jump] && !this.isJumping) {
                this.jumpStartTime = performance.now();
                this.isJumping = true;
            }

            if (this.isJumping && this.jumpStartTime) {
                const elapsedTime = (performance.now() - this.jumpStartTime) / 1000;
                const jumpVelocity = this.currentJumpSpeed * Math.exp(-this.k * elapsedTime);

                if (jumpVelocity > this.jumpThreshold)
                    this.entity.moveWithCollisions(new Vector3(0, jumpVelocity * deltaTime, 0));
                else
                    this.isJumping = false;
            }
            else
                this.entity.moveWithCollisions(new Vector3(0, this.currentGravity * deltaTime, 0));
        } else {
            const dir = +this.input.inputMap[Key.Jump] - +this.input.inputMap[Key.Ctrl];
            if (dir) {
                this.entity.moveWithCollisions(new Vector3(0, dir * this.linearSpeed * deltaTime, 0));
            }
        }
    }

    private moveBeforeRender(deltaTime: number) {
        const movUpDown = +this.input.inputMap[Key.Up] - +this.input.inputMap[Key.Down]
        const movLeftRight = +this.input.inputMap[Key.Left] - +this.input.inputMap[Key.Right]
        const isRunning = this.input.inputMap[Key.Shift]
        const displacement = this.linearSpeed * deltaTime * (1 + +isRunning);

        if (movUpDown) {
            this.playAnimation(Player.Animation.Run);
            const x = this.entity.getForward().dot(Vector3.Right());
            const z = this.entity.getForward().dot(Vector3.Forward());
            const scale = movLeftRight ? displacement * movUpDown * 0.7 : displacement * movUpDown;
            this.entity.moveWithCollisions(new Vector3(x, 0, z).normalize().scale(scale));
        }
        if (movLeftRight) {
            this.playAnimation(Player.Animation.Run);
            const t = movLeftRight == 1 ? Vector3.Up() : Vector3.Down();
            const scale = movUpDown ? displacement * 0.7 : displacement;
            this.entity.moveWithCollisions(this.entity.getForward().cross(t).normalize().scale(scale));
        }
        if (!movUpDown && !movLeftRight)
            this.playAnimation(Player.Animation.Idle);
    }

    private cameraRotationBeforeRender() {
        const oldRotation = this.entity.rotation;
        let newRotationX = oldRotation.x + this.input.MouseMovement.y * this.mouseSensibilityY;
        let newRotationY = oldRotation.y + this.input.MouseMovement.x * this.mouseSensibilityX;

        // Clamp the rotation to avoid flipping
        const margin = 0.05;
        if (newRotationX > Math.PI / 2 - margin) newRotationX = Math.PI / 2 - margin;
        if (newRotationX < -Math.PI / 2 + margin) newRotationX = -Math.PI / 2 + margin;
        if (newRotationY > 2 * Math.PI) newRotationY = 0;
        if (newRotationY < 0) newRotationY = 2 * Math.PI;

        // Set the new rotation
        this.entity.rotation = new Vector3(newRotationX, newRotationY, oldRotation.z);
        this.input.MouseMovement.y = this.input.MouseMovement.x = 0;

    }
    //returns the block in front of the player, if any
    private highlightHitBlock(hit: Nullable<PickingInfo>): void {
        if (hit && hit.pickedMesh && this.oldHitMesh && hit.pickedMesh !== this.oldHitMesh) {
            this.oldHitMesh.disableEdgesRendering();
            this.oldHitMesh = null;
        }
        if ((!hit || !hit.pickedMesh) && this.oldHitMesh) {
            this.oldHitMesh.disableEdgesRendering();
            this.oldHitMesh = null;
        }
        if (hit && hit.pickedMesh && !this.entity.isSameMesh(hit.pickedMesh) && hit.pickedMesh !== this.oldHitMesh) {
            //console.log(hit.pickedMesh.name, this.oldHitMesh?.name);
            hit.pickedMesh.edgesColor = new Color4(0.5, 0.5, 0.5, 1);
            hit.pickedMesh.edgesWidth = 1;
            hit.pickedMesh.enableEdgesRendering();
            this.oldHitMesh = hit.pickedMesh;
            console.log(this.oldHitMesh.position);
        }
    }

    setupGUI() {
        this.gui.isVisible = true;
    }
    private guiBeforeRender() {
        if (this.input.inputMap[Key.Hud]) {
            this.gui.toggleUIVisibility();
            this.input.inputMap[Key.Hud] = false;
        }
        this.gui.PauseMenuVisibility = !this.input.isPointerLocked;
        if (this.input.inputMap[Key.Escape]) {
            Game.Instance.audio.pause();
            this.input.isWorldPlaying = false;
            this.gui.PauseMenuVisibility = true;
            this.input.inputMap[Key.Escape] = false;
        }
    }

    public beforeRenderUpdate(): void {
        // Gets the time spent between current and previous frame
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        this.jumpBeforeRender(deltaTime);
        this.moveBeforeRender(deltaTime);
        this.cameraRotationBeforeRender();

        const ray = new Ray(this.entity.position, this.entity.getForward(), this.blockPickRange);
        const hit = this.scene.pickWithRay(ray);

        this.highlightHitBlock(hit);

        if (this.input.inputMap[Key.ScreenShot]) {
            this.input.inputMap[Key.ScreenShot] = false;
            const date = new Date();
            const filename = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}.png`;
            Tools.CreateScreenshotUsingRenderTarget(this.scene.getEngine(), this.scene.activeCamera!,
                { precision: 1 }, undefined, undefined, undefined, undefined, filename);
            Logger.Log(`Saved screenshot as ` + filename);
        }
        this.guiBeforeRender();
    }
}
