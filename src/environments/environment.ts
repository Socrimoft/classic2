import { CreateBox, DirectionalLight, Mesh, Vector3 } from "@babylonjs/core";
import { Player } from "../actors/player";
import { GameEntity } from "../actors/gameEntity";
import { LevelScene } from "../scenes/levelScene";
import { Random } from "../random";
import { Game } from "../game";

/**
 * Abstract class for game environments.\
 * This class is used to set up the environment for the game, including the skybox, ground segments, static objects, and entities.\
 */
export abstract class Environment {
    protected scene: LevelScene;
    protected player: Player;

    protected skybox: Mesh;
    protected skyboxSize = 10000;

    private groundSegments: Array<Mesh> = [];
    private staticObjects: Array<Mesh> = [];
    private entitiesObjects: Array<GameEntity> = [];
    protected random: Random;

    constructor(scene: LevelScene, player: Player, seed?: number) {
        this.scene = scene;
        this.random = new Random(seed ?? Number(Game.urlParams.get("seed") ?? Math.random() * 4294967296));
        this.player = player;
        this.skybox = CreateBox("skybox", { size: this.skyboxSize }, this.scene);

    }

    public get seed(): number {
        return this.random.getSeed;
    }

    public getLight(): DirectionalLight {
        if (this.scene.lights.length == 0)
            throw new Error("Cannot return non-instanciated light");
        return this.scene.lights[0] as DirectionalLight;
    }

    protected getGroundSegments(): Array<Mesh> {
        return this.groundSegments;
    }

    protected setGroundSegments(segments: Array<Mesh>): void {
        this.groundSegments = segments;
    }

    protected pushGroundSegment(mesh: Mesh, position?: Vector3) {
        if (position) mesh.position = position;
        this.groundSegments.push(mesh);
    }

    protected pushStaticObject(mesh: Mesh, position: Vector3) {
        mesh.position = position;
        this.staticObjects.push(mesh);
    }

    protected pushEntityObject(entity: GameEntity, position: Vector3) {
        entity.position = position;
        entity.activateEntityComponents();
        this.entitiesObjects.push(entity);

    }

    public async load(classicLevel?: number): Promise<void> {
        this.setupLight();
        this.setupSkybox();
        await this.loadEnvironment(classicLevel);
    }

    public setupShadows(): void {
    }

    abstract setupSkybox(): void;
    abstract loadEnvironment(classicLevel?: number): Promise<void>;
    abstract setupLight(): void;
    abstract beforeRenderUpdate(): void;
}
