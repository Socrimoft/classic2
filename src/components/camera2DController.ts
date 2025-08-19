import { TransformNode, UniversalCamera, Vector3 } from "@babylonjs/core";
import { Component } from "./component";
import { Player } from "../actors/player";

export class Camera2DController extends UniversalCamera implements Component {
    private targetEntity: Player;
    private camRoot: TransformNode;
    private camTilt: TransformNode;

    constructor(targetEntity: Player, _: any = null) {
        super("playerCamera", new Vector3(0, 0, targetEntity.position.z - 20), targetEntity.scene);
        this.targetEntity = targetEntity;

        this.camRoot = new TransformNode("camRoot");
        this.camRoot.position = Vector3.Zero();
        this.lockedTarget = this.camRoot.position;

        let camTilt = new TransformNode("camTilt");
        camTilt.rotation = new Vector3(Math.PI / 15, 0, 0);
        this.camTilt = camTilt;
        this.camTilt.parent = this.camRoot;

        this.parent = this.camTilt;
    }

    public beforeRenderUpdate(): void {
        // update position
        this.camRoot.position = Vector3.Lerp(this.camRoot.position, new Vector3(this.targetEntity.position.x + (this.targetEntity.getForward().x * 5), this.targetEntity.position.y + 3, this.targetEntity.position.z), 0.1);
    }
}
