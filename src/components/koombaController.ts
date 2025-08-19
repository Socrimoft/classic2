import { Ray, Vector3 } from "@babylonjs/core";
import { EntityController } from "./entityController";
import { Koomba } from "../actors/koomba";

export class KoombaController extends EntityController {
    protected linearSpeed = 1;

    constructor(entity: Koomba) {
        super(entity);
        this.entity.stopAllAnims();
        this.playAnimation(Koomba.Animation.Walk);
    }

    beforeRenderUpdate(): void {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        this.entity.moveForwardWithCollisions(this.linearSpeed * deltaTime);
        this.entity.moveWithCollisions(new Vector3(0, this.defaultGravity * deltaTime, 0));

        const raycast = new Ray(this.entity.position, new Vector3(0, this.entity.rotation.y / 90, 0), 1)
        const hit = this.scene.pickWithRay(raycast, (mesh) => mesh.name !== this.entity.meshRef.name);
        if (hit && hit.pickedMesh && hit.pickedMesh !== this.entity.meshRef) {
            this.entity.rotation = new Vector3(0, -this.entity.rotation.y, 0);
        }

        if (this.entity.position.y < 0)
            this.entity.dispose();
    }
}
