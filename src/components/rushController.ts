import { Ray, Vector3 } from "@babylonjs/core";
import { InputManager, Key } from "../inputManager";
import { EntityController } from "./entityController";
import { Player } from "../actors/player";
import { Game } from "../game";

export class RushController extends EntityController {
    private input: InputManager;

    private spaceBarWasClicked: boolean = false;

    constructor(player: Player, input: InputManager) {
        super(player);
        this.input = input;

        // ----- Register Animations Callbacks -----
        this.getAnimation(Player.Animation.Jump_Start).onAnimationGroupEndObservable.add(() => {
            this.playAnimation(Player.Animation.Jump_Air);
            this.jumpStartTime = performance.now();
        });

        this.getAnimation(Player.Animation.Inflate).onAnimationGroupEndObservable.add(() => {
            this.playAnimation(Player.Animation.FlyIdle, true);
        });

        this.getAnimation(Player.Animation.Fly).onAnimationGroupEndObservable.add(() => {
            this.playAnimation(Player.Animation.FlyIdle, true);
            this.flyImpulse = false;
        });

        this.entity.stopAllAnims();
        this.playAnimation(Player.Animation.Idle);
    }

    private playGroundedAnimation(name: string, loop?: boolean): void {
        if (this.isGrounded && !this.isJumping)
            super.playAnimation(name, loop);
    }

    public beforeRenderUpdate(): void {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        // ----- Checks -----
        if (this.entity.position.y < 0) {
            this.entity.dispose();
            Game.Instance.switchToGameOver(this.scene.score);
        }

        // ----- Movements and Animations -----

        if (this.isGrounded && !this.isJumping) {
            // reset values
            this.currentJumpSpeed = this.defaultJumpSpeed;
            this.currentGravity = this.defaultGravity;
            this.spaceBarWasClicked = false;
            this.isFlying = false;
        }

        if (this.isJumping && this.isAnimationPlaying(Player.Animation.Jump_Air)) {
            const elapsedTime = (performance.now() - this.jumpStartTime) / 1000;
            const jumpVelocity = this.currentJumpSpeed * Math.exp(-this.k * elapsedTime);
            if (jumpVelocity > this.jumpThreshold)
                this.entity.moveWithCollisions(new Vector3(0, jumpVelocity * deltaTime, 0));
            else {
                this.playAnimation(Player.Animation.Jump_Flip, false);
                this.isJumping = false;
            }
        }
        else if (this.isFlying && this.flyImpulse) {
            const elapsedTime = (performance.now() - this.flyImpulseStartTime) / 1000;
            const impulseVelocity = 25 * Math.exp(-2.5 * elapsedTime);
            if (impulseVelocity > 10)
                this.entity.moveWithCollisions(new Vector3(0, impulseVelocity * deltaTime, 0));
            else
                this.flyImpulse = false;
        }
        else
            this.entity.moveWithCollisions(new Vector3(0, this.currentGravity * deltaTime, 0));

        if (this.input.inputMap[Key.Jump]) {
            if (this.isGrounded) {
                this.playGroundedAnimation(Player.Animation.Jump_Start, false);
                this.isJumping = true;
            }
            else if (this.isAnimationPlaying(Player.Animation.Jump_Air) && !this.spaceBarWasClicked && this.currentJumpSpeed < this.maxJumpSpeed)
                this.currentJumpSpeed += 0.5;
            else if (this.spaceBarWasClicked) {
                if (!this.isFlying) {
                    this.playAnimation(Player.Animation.Inflate, false);
                    this.isJumping = false;
                    this.isFlying = true;
                    // this.currentGravity = this.flyingGravity;
                }
                else {
                    this.playAnimation(Player.Animation.Fly, false);
                }
                this.flyImpulse = true;
                this.flyImpulseStartTime = performance.now();
                this.spaceBarWasClicked = false;
            }
        }
        else if (this.isJumping || this.isFlying || this.isAnimationPlaying(Player.Animation.Jump_Flip))
            this.spaceBarWasClicked = true;

        if (this.input.inputMap[Key.Right]) {
            this.entity.rotation = new Vector3(0, Math.PI / 2, 0);
            this.playGroundedAnimation(Player.Animation.Run);
            this.entity.moveForwardWithCollisions(this.linearSpeed * deltaTime);
        }
        else if (this.input.inputMap[Key.Left]) {
            this.entity.rotation = new Vector3(0, -Math.PI / 2, 0);
            this.playGroundedAnimation(Player.Animation.Run);
            this.entity.moveForwardWithCollisions(this.linearSpeed * deltaTime);
        }
        else
            this.playGroundedAnimation(Player.Animation.Idle);
    }
}
