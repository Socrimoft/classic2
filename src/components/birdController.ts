import { Ray, Vector3 } from "@babylonjs/core";
import { InputManager, Key } from "../inputManager";
import { EntityController } from "./entityController";
import { Game } from "../game";
import { Player } from "../actors/player";

export class BirdController extends EntityController {
    private input: InputManager;
    private lastPoX: number = 40;

    protected linearSpeed: number = 13;
    protected gravity: number = -18;
    protected jumpSpeed: number = 28;
    protected jumpThreshold: number = 12;
    protected k: number = 3;


    protected jumpStartTime: number = 0;
    protected isJumping: boolean = false;

    constructor(entity: Player, input: InputManager) {
        super(entity);
        this.input = input;
    }

    public beforeRenderUpdate(): void {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        if (this.input.inputMap[Key.Jump] && !this.isJumping) {
            this.jumpStartTime = performance.now();
            this.isJumping = true;
        }

        if (this.isJumping && this.jumpStartTime) {
            const elapsedTime = (performance.now() - this.jumpStartTime) / 1000;
            const jumpVelocity = this.jumpSpeed * Math.exp(-this.k * elapsedTime);

            if (jumpVelocity > this.jumpThreshold)
                this.entity.moveWithCollisions(new Vector3(0, jumpVelocity * deltaTime, 0));
            else
                this.isJumping = false;
        }
        else
            this.entity.moveWithCollisions(new Vector3(0, this.gravity * deltaTime, 0));

        this.entity.rotation = new Vector3(0, Math.PI / 2, 0);
        this.playAnimation(Player.Animation.Run);
        this.entity.moveForwardWithCollisions(this.linearSpeed * deltaTime);

        // detect if grounded
        const directions = [
            Vector3.Left(),
            Vector3.Right(),
        ];

        let hitDetected = false;

        for (const direction of directions) {
            const ray = new Ray(this.entity.position, direction, 1);
            const hit = this.scene.pickWithRay(ray);

            if (hit && hit.pickedMesh && hit.pickedMesh.name.includes("pipe")) {
                hitDetected = true;
                break;
            }
        }

        if (hitDetected) {
            Game.Instance.switchToGameOver(this.scene.score);
        }

        //check for points
        if (this.entity.position.x > this.lastPoX + 26) {
            this.lastPoX += 26;
            this.scene.updateScore(1);
        }
    }
}
