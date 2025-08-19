import { Color4, Logger, Scene, Vector3, WebGPUEngine } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { InputManager } from "../inputManager";
import { Player } from "../actors/player";
import { Environment } from "../environments/environment";
import { World } from "../environments/minigames/world";
import { WorldController } from "../components/worldController";

enum loadableGame {
    rush = 1,
    bird = 2,
    world = 3,
    classic = 4
}

enum classicLoadableLevel {
    classic = 0,
    kircity = 1,
    kirbros = 2,
    kirbykawaii = 3,
    kirdoom = 4
}

enum worldType {
    flat = 1,
    normal = 2
}

/**
 * Generic game level scene class.\
 * This class is used to set up the game level itself, load the environment, and manage the player.\
 * It extends the Scene class from Babylon.js and uses the WebGPUEngine for rendering.\
 * It also display a score for the game. (to display a score on the gameover screen)
 */
export class LevelScene extends Scene {
    private player: Player;
    public input: InputManager;

    public environment?: Environment;

    public score: number = 0;
    public scoreText: TextBlock;

    constructor(engine: WebGPUEngine) {
        super(engine);
        this.input = new InputManager(this);
        this.player = new Player(this);
        this.clearColor = new Color4(0.8, 0.9, 1, 1);
        this.scoreText = new TextBlock("score");
    }

    /**
     * Load a basic GUI for the game.\
     * This method creates a fullscreen UI and adds the score text block to it.\
     */
    public async load() {
        //GUI
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.scoreText.color = "white";
        this.scoreText.fontSize = 25;
        this.scoreText.top = "-45%";
        this.scoreText.left = "-45%";
        playerUI.addControl(this.scoreText);
    }

    /**
     * Update the score of the game.\
     * @param value the value to add to the current score.
     */
    public updateScore(value: number) {
        this.score += value;
        this.scoreText.text = "Score : " + this.score;
    }

    /**
     * Update the navigator history with the current game state.\
     * This method updates the URL with the current game state, including the game type and seed if applicable.
     * This is useful for bookmarking or sharing the current game state.\
     * This methos do not reload the page, it just updates the URL.\
     */
    public updateNavigatorHistory(data?: { [key: string]: string }) {
        const params = new URLSearchParams(data)
        window.history.pushState(data, "", "?" + params.toString())
    }

    /**
     * to verify game value in the url.
     */
    private static isGametoLoadValid(gameToLoad: any): gameToLoad is loadableGame {
        return typeof gameToLoad === "number" && Object.values(loadableGame).includes(gameToLoad);
    }
    /**
     * to verify classic value in the url.
     */
    private static isClassicLevelValid(classicLevel: any): classicLevel is classicLoadableLevel {
        return typeof classicLevel === "number" && Object.values(classicLoadableLevel).includes(classicLevel);
    }

    /**
     * to verify world type value in the url.
     */
    private static isWorldTypeValid(worldtype: any): worldtype is worldType {
        return typeof worldtype === "number" && Object.values(worldType).includes(worldtype);
    }

    /**
     * Set up the level scene with the specified game type and classic level.\
     * This method loads the environment based on the game type and classic level, load the player mesh, and adds the appropriate controller.\
     * It also sets up shadows and registers a before render update for the environment.
     * @param gameToLoad The game type to load (e.g., rush, bird, world, classic).
     * @param classicLevel The classic level to load (if applicable).
     * @param _seed The seed for the game (optional).
     */
    public async setUpLevelAsync(gameToLoad: number | string, classicLevel?: number | string, _seed?: number): Promise<void> {
        // environment
        Logger.Log(["Loading game: " + gameToLoad, _seed != undefined ? ("with seed: " + _seed) : ""]);
        if (typeof gameToLoad === "string") {
            gameToLoad = Object.values(loadableGame).indexOf(gameToLoad.toLowerCase()) + 1;
        }
        if (!LevelScene.isGametoLoadValid(gameToLoad)) {
            gameToLoad = loadableGame.rush;
        }
        if (!_seed && gameToLoad !== loadableGame.world) _seed = undefined;
        const playerpos = new Vector3(0, 20, 0);
        const playerrot = new Vector3(0, Math.PI / 2, 0);

        this.input.actualGame = gameToLoad;

        //switch (gameToLoad) {
        //    case loadableGame.world:
                if (typeof classicLevel === "string") {
                    classicLevel = Object.values(worldType).indexOf(classicLevel.toLowerCase()) + 1;
                }
                if (!LevelScene.isWorldTypeValid(classicLevel)) {
                    classicLevel = worldType.flat;
                }
                const worldTypeName = Object.values(worldType)[classicLevel - 1] as string;
                this.environment = new World(this, this.player, _seed);
                Logger.Log("loadEnvironment: " + worldTypeName);
                await this.player.instanciate(playerpos, playerrot, this.input, false);
                await this.environment.load(classicLevel); // classicLevel is the world type (flat or normal)
                this.updateNavigatorHistory({ game: "world", worldtype: worldTypeName, seed: this.environment.seed.toString() });
                const controller = new WorldController(this.player, this.input);
                controller.setupGUI();
                this.player.addComponent(controller);
                //break;
        //};

        this.player.activateEntityComponents();

        this.environment.setupShadows();

        this.registerBeforeRender(() => {
            this.environment!.beforeRenderUpdate();
        });
    }
}
