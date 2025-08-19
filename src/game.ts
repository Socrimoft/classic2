import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Logger, ShaderStore, WebGPUEngine } from "@babylonjs/core";
import { MainMenuScene } from "./scenes/mainMenuScene";
import { CutSceneScene } from "./scenes/cutSceneScene";
import { LevelScene } from "./scenes/levelScene";
import { GameOverScene } from "./scenes/gameOverScene";
import toonVertexShader from "./shaders/toon/vertex.wgsl";
import toonFragmentShader from "./shaders/toon/fragment.wgsl";
import { KerbyLoadingScreen } from "./loadingScreen";
import { AudioManager } from "./audioManager";
import { IntroScene } from "./scenes/introScene";

/**
 * Enum representing the different states of the game.
 * @kind Intro - Pixar intro.
 * @kind MainMenu - The main menu state of the game.
 * @kind CutScene - The cutscene state of the game.
 * @kind Level - The level state of the game.
 * @kind GameOver - The game over state of the game.
 */
enum State {
    INTRO,
    MAINMENU,
    CUTSCENE,
    LEVEL,
    GAMEOVER
}

/**
 * The Game class is the main entry point for the game.
 * It initializes the game engine, creates the canvas, and manages the game states.
 * It also handles switching between different scenes such as the main menu, cutscene, level, and game over.
 * It is a singleton class, meaning only one instance of it can exist at a time.
 * The singleton instance can be accessed via `Game.Instance` and is created when `DOMContentLoad` event fires.
 */
export class Game {
    private static instance: Game;
    public canvas: HTMLCanvasElement;
    public engine: WebGPUEngine;
    private introScene!: IntroScene;
    private mainMenuScene!: MainMenuScene;
    private cutScene!: CutSceneScene;
    private levelScene!: LevelScene;
    private gameOverScene!: GameOverScene;
    public audio: AudioManager;

    private state: State = State.MAINMENU;
    private options = { doNotHandleContextLost: false, audioEngine: true, renderEvenInBackground: true, antialias: true }

    constructor() {
        if (navigator.gpu === undefined) {
            errorHandler(new Error("WebGPU not supported. Try using a different browser or enable WebGPU in your browser settings."));
        }
        this.canvas = this.createCanvas();
        this.engine = this.createEngine();
        this.engine.loadingScreen = new KerbyLoadingScreen("");
        if (process.env.NODE_ENV === "development") {
            Logger.LogLevels = Logger.AllLogLevel; // all logs
            Logger.Log("Development mode enabled");
            this.engine.enableOfflineSupport = false;
            window.addEventListener("keydown", (ev) => {
                if (ev.ctrlKey && ev.altKey && ev.key === "i") {
                    if (this.CurrentScene.debugLayer.isVisible()) {
                        this.CurrentScene.debugLayer.hide();
                    } else {
                        this.CurrentScene.debugLayer.show();
                    }
                }
            });
        } else {
            Logger.LogLevels = Logger.ErrorLogLevel; // errors only
            this.engine.enableOfflineSupport = true;
        }

        // load shaders
        ShaderStore.ShadersStoreWGSL["toonVertexShader"] = toonVertexShader;
        ShaderStore.ShadersStoreWGSL["toonFragmentShader"] = toonFragmentShader;
        // Animation.AllowMatricesInterpolation = true;

        this.audio = new AudioManager();

        this.main();
    }

    public static get urlParams() {
        return new URLSearchParams(window.location.search);
    }

    /**
     * Singleton instance accessor of the Game class.
     * This ensures that only one instance of the Game class is created throughout the application.
     * @return The singleton instance of the Game class.
     */
    public static get Instance(): Game {
        return this.instance || (this.instance = new this());
    }

    /**
     * Accessor for the current scene based on the game state.
     * This allows easy access to the current scene without needing to check the state manually.
     * @return The current scene based on the game state.
     */
    public get CurrentScene(): IntroScene | MainMenuScene | CutSceneScene | LevelScene | GameOverScene {
        switch (this.state) {
            case State.INTRO:
                return this.introScene;
            case State.CUTSCENE:
                return this.cutScene;
            case State.LEVEL:
                return this.levelScene;
            case State.GAMEOVER:
                return this.gameOverScene;
            default:
                return this.mainMenuScene;
        }
    }

    /**
     * Creates a canvas element for the game to render on.
     * This canvas will fill the entire viewport and will be appended to the body of the document.
     */
    private createCanvas(): HTMLCanvasElement {
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);

        return this.canvas;
    }

    /**
     * Creates a WebGPUEngine instance for rendering the game.
     * If WebGPU is not supported, the game will not start and an error will be logged.
     */
    private createEngine(): WebGPUEngine {
        const engine = new WebGPUEngine(this.canvas, this.options);
        if (navigator.gpu) { // should be the synchronous variant of "await WebGPUEngine.IsSupportedAsync"
            engine.initAsync().then(() => engine.getCaps().supportComputeShaders = true);
        } else {
            errorHandler(new Error(`WebGPU not supported. Try using a different browser or enable WebGPU in your browser settings.
            Go to https://caniuse.com/webgpu ?`), () => window.open("https://caniuse.com/webgpu", "_blank"));
        }
        return engine;
    }

    private async main(): Promise<void> {
        this.engine.displayLoadingUI();
        this.engine.compatibilityMode = true; // false breaks level scenes

        await this.engine.initAsync().catch((err) => errorHandler(err));
        await this.audio.init().catch((err) => errorHandler(err));
        await this.audio.unlock().catch((err) => errorHandler(err));

        let level = Game.urlParams.get("game");
        let classicLevel = Game.urlParams.get("classic") || Game.urlParams.get("worldtype");
        let seed = Game.urlParams.get("seed");

        if (level)
            await this.switchToCutScene(level, classicLevel || undefined, seed ? +seed : undefined);
        else
            await this.switchToIntro();
        this.engine.hideLoadingUI();

        this.engine.runRenderLoop(() => {
            this.CurrentScene.render();
        });
        //resize screen
        window.addEventListener("resize", () => {
            this.engine.resize();
        });

    }
    /**
     * Switches to the intro scene of the game.
     * This method initializes the intro scene and waits for it to be ready before switching the state.
     */
    public async switchToIntro() {
        this.engine.displayLoadingUI();

        this.introScene = new IntroScene(this.engine);
        this.introScene.load();

        // finish setup
        await this.introScene.whenReadyAsync();
        this.engine.hideLoadingUI();
        this.state = State.INTRO;
    }

    public async switchToMainMenu() {
        this.engine.displayLoadingUI();

        this.mainMenuScene = new MainMenuScene(this.engine);
        this.mainMenuScene.load();

        console.log("Switching to main menu scene");
        // finish setup
        await this.mainMenuScene.whenReadyAsync();
        this.engine.hideLoadingUI();
        this.state = State.MAINMENU;
    }

    public async switchToCutScene(levelToLoad: number | string, classicLevel?: number | string, seed?: number) {
        const isWorld = levelToLoad == "world" || levelToLoad == 3
        if (!isWorld) {
            this.engine.displayLoadingUI();

            this.cutScene = new CutSceneScene(this.engine);
            this.cutScene.load(levelToLoad);

            // finish setup
            await this.cutScene.whenReadyAsync();
            this.engine.hideLoadingUI();
            this.state = State.CUTSCENE;
        }
        // setting up during current scene
        this.levelScene = new LevelScene(this.engine);
        await this.levelScene.setUpLevelAsync(levelToLoad, classicLevel, seed);
        if (isWorld) await this.switchToLevel();
    }

    public async switchToLevel() {
        this.levelScene.load();

        await this.levelScene.whenReadyAsync();
        this.state = State.LEVEL;
        this.engine.hideLoadingUI();
        this.levelScene.attachControl();
    }

    public async switchToGameOver(score?: number) {
        this.gameOverScene = new GameOverScene(this.engine);
        this.gameOverScene.load(score);

        await this.gameOverScene.whenReadyAsync();
        this.state = State.GAMEOVER;
        this.engine.hideLoadingUI();
    }
}

function errorHandler(error: Error, callback = () => location.reload()) {
    console.error("Error occurred:", error);
    confirm("An error occurred: " + error.message) && callback();
}

document.addEventListener("DOMContentLoaded", () => Game.Instance);
