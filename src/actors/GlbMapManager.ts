import { Vector3 } from "@babylonjs/core";
import { GameEntity } from "./gameEntity";
import { LevelScene } from "../scenes/levelScene";

export class GlbMapManager extends GameEntity {

    constructor(name: string, scene: LevelScene) {
        super(name, scene);
    }

    public async instanciate(position = Vector3.Zero(), rotation = Vector3.Zero(), size: number = 1): Promise<void> {
        await super.instanciate(position, rotation);
        this.mesh!.scaling = new Vector3(size, size, size);
    }
}