import { Vector3 } from "@babylonjs/core";
import { GameEntity } from "./gameEntity";
import { LevelScene } from "../scenes/levelScene";

export class Portal extends GameEntity {

    constructor(scene: LevelScene, isShortcut: boolean = false) {
        super(isShortcut ? "portalshort" : "portal", scene);
    }

    public async instanciate(position = Vector3.Zero(), rotation = Vector3.Zero(), size: number = 1): Promise<void> {
        await super.instanciate(position, rotation);
        this.mesh!.scaling = new Vector3(size, size, size);
    }
}