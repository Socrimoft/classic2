import { LevelScene } from "../scenes/levelScene";
import { Component } from "./component";
import { GameEntity } from "../actors/gameEntity";
import { Ray, RayHelper, Vector3 } from "@babylonjs/core";

class ExponentialInterpolator {
    public constructor() {

    }
}

export abstract class EntityController implements Component {
    public scene: LevelScene;
    protected entity: GameEntity;

    protected linearSpeed: number = 20;
    protected defaultGravity: number = -12;
    protected flyingGravity: number = -5;
    protected currentGravity: number = this.defaultGravity;
    protected defaultJumpSpeed: number = 25;
    protected maxJumpSpeed: number = 40;
    protected currentJumpSpeed: number = this.defaultJumpSpeed;
    protected jumpThreshold: number = 9;
    protected k: number = 2.5;

    protected jumpStartTime: number = 0;
    protected isGrounded: boolean = false;
    protected isJumping: boolean = false;
    protected isFlying: boolean = false;
    protected flyImpulse: boolean = false;
    protected flyImpulseStartTime: number = 0;

    constructor(entity: GameEntity) {
        this.entity = entity;
        this.scene = entity.scene;

        this.entity.meshRef.getChildMeshes().forEach(mesh => mesh.isPickable = false);
        this.entity.meshRef.isPickable = false;

        const groundedRay = new Ray(Vector3.Zero(), Vector3.Down(), 1.5);
        // const rayHelper = new RayHelper(groundedRay);
        // rayHelper.show(this.scene);

        this.scene.onBeforeRenderObservable.add(() => {
            groundedRay.origin = new Vector3(this.entity.position.x, this.entity.position.y, this.entity.position.z);

            const hit = this.scene.pickWithRay(groundedRay);
            if (hit && hit.pickedMesh)
                this.isGrounded = true;
            else
                this.isGrounded = false;
        });
    }

    protected getAnimation(name: string) {
        return this.entity.getAnimByName(name);
    }

    protected playAnimation(name: string, loop: boolean = true): void {
        const anim = this.entity.getAnimByName(name);
        if (!anim.isPlaying) {
            this.entity.stopAllAnims();
            anim.play(loop);
        }
    }

    protected stopAnimation(name: string): void {
        this.entity.getAnimByName(name).stop();
    }

    protected isAnimationPlaying(name: string): boolean {
        return this.entity.getAnimByName(name).isPlaying;
    }

    abstract beforeRenderUpdate(): void;
}
