import { Mesh, Vector3 } from "@babylonjs/core";
import { LevelScene } from "../scenes/levelScene";
import { Component } from "../components/component";
import { GameEntity } from "./gameEntity";
import { KoombaController } from "../components/koombaController";

/**
 * Class representing a Koomba entity in the game.\
 * This class extends the GameEntity class and provides specific functionality for the Koomba character.
 */
export class Koomba extends GameEntity {
    static Animation = {
        Walk: "Take 001"
    } as const;

    constructor(scene: LevelScene, ...components: Component[]) {
        super("koomba", scene, ...components)
    }

    public async instanciate(position?: Vector3, rotation?: Vector3): Promise<void> {
        await super.instanciate(position, rotation);
        if (!this.mesh)
            throw new Error("Error while instanciating the GameEntity " + this.name);

        this.mesh.scaling = new Vector3(0.025, 0.025, 0.025);
        this.mesh.getChildren<Mesh>(undefined, true)[0].position = new Vector3(0, -26.038, 2.129); //remove the mesh's position bias
        this.registerAnimations((Object.values(Koomba.Animation) as string[]));
        this.addComponent(new KoombaController(this));
    }

    public clone(name?: string, position?: Vector3, rotation?: Vector3, cloneComponents: boolean = false): Koomba {
        const koomba = super.clone(name, position, rotation, cloneComponents);
        koomba.registerAnimations((Object.values(Koomba.Animation) as string[]));
        koomba.addComponent(new KoombaController(koomba));
        return koomba;
    }
}
