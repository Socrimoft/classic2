import { ActionManager, ExecuteCodeAction, Scene } from "@babylonjs/core";
import { InputManager as MouseManager } from "@babylonjs/core/Inputs/scene.inputManager";

/**
 * Enum for keyboard keys used in every game.
 */
export enum Key {
    Up = 'KeyW',
    Down = "KeyS",
    Left = "KeyA",
    Right = "KeyD",
    Jump = "Space",
    LeftClick = "lclick",
    RightClick = "rclick",
    Action = "AltLeft",
    Shift = "ShiftLeft",
    Ctrl = "ControlLeft",
    Camera = "F5",
    Stats = "F3",
    ScreenShot = "F2",
    Hud = "F1",
    Escape = "Escape",
    Chat = "KeyT"
}

enum Games {
    none = 0,
    rush = 1,
    bird = 2,
    world = 3,
    classic = 4
}

/**
 * The InputManager class handles input events for the game.\
 * It extends the MouseManager class to capture mouse events and pointer lock state.\
 * It manages keyboard input for various game controls and provides a way to track mouse movement.
 */
export class InputManager extends MouseManager {
    /**
     * The mouse movement since the game has retrieved the data.\
     * This is used to rotate the camera in the world game.\
     * It is not reset automatically, unless the pointer is not locked.
     */
    public MouseMovement = { x: 0, y: 0 };
    /**
     * The canvas used to capture the mouse events.\
     * This is used to request pointer lock and handle mouse events.
     */
    private canvas: HTMLCanvasElement;
    /**
     * Map of input keys to their pressed state.\
     * This is used to track which keys are currently pressed down.\
     * The keys are defined in the `Key` enum.\
     * The keys are set to `false` by default, and are set to `true` when the key is pressed down.
     * @example
     * inputMap[Key.Up] == true // the up key is pressed down
     * inputMap[Key.Down] == false // the down key is not pressed down
     */
    public inputMap: { [key in Key]: boolean } = Object.fromEntries(
        Object.values(Key).map((key) => [key, false])
    ) as any;
    /**
     * Flag to indicate if the world game is currently being played.\
     * This is used to determine if the game is in the world mode or not.
     * @deprecated use `actualGame` instead.
     * @todo Remove this in the future.
     */
    public isWorldPlaying: boolean = false;
    /**
     * The game currently being played.\
     * This is used to determine which game is currently active and what controls to apply.\
     * `F1` open the github page in classic and rush, but not in world, it toggles the UI)
     */
    public actualGame: Games = Games.none;
    /**
     * Flag to indicate if the pointer is currently locked to the canvas.\
     * This is used to determine if the mouse movement should be captured or not.
     */
    public isPointerLocked: boolean = false;

    constructor(scene: Scene) {
        super(scene);
        const canvas = scene.getEngine().getRenderingCanvas();
        if (!canvas) throw new Error("no canvas on engine");
        this.canvas = canvas;
        scene.actionManager = new ActionManager(scene);
        this.inputMap[Key.Escape] = true; // simulate keydown to bring the pause menu in the event of pointer not being locked
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
            const key = event.sourceEvent.code;
            switch (key as Key) {
                case (Key.Escape):
                    if (this.isWorldPlaying && !this.isPointerLocked) {
                        //event.sourceEvent.preventDefault();
                        this.MouseMovement.x = 0;
                        this.MouseMovement.y = 0;
                        this.isWorldPlaying = false;
                    };
                    break;
                case (Key.Hud):         //F1
                    if (!this.isWorldPlaying)
                        window.open("https://github.com/Socrimoft/Kerby64", "_blank");
                case (Key.ScreenShot):  //F2
                case (Key.Stats):       //F3
                case (Key.Camera):      //F5
                case (Key.Action):     //LeftAlt
                default:
                    if (this.isWorldPlaying)
                        event.sourceEvent.preventDefault();
                    this.inputMap[key] = event.sourceEvent.type == "keydown";
                    break;
            }
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
            this.inputMap[event.sourceEvent.code] = event.sourceEvent.type == "keydown";
        }));
        document.addEventListener("pointerlockchange", () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas
            if (!this.isPointerLocked) {
                this.inputMap[Key.Escape] = true;
            }
            //(this.isPointerLocked ? this.attachControl : this.detachControl)();
            //console.log(`input : ${this.isPointerLocked} ${this.isWorldPlaying}`);
        });
        scene.onPointerObservable.add((pointerInfo) => {
            if (!this.isPointerLocked) return;
            if (pointerInfo.type == 4) { // PointerMove
                this.MouseMovement.x += pointerInfo.event.movementX;
                this.MouseMovement.y += pointerInfo.event.movementY;
            }
        });

        // Request pointer lock for the canvas + handle clicks
        this.canvas.addEventListener("pointerdown", (event) => {

            switch (this.actualGame) {
                case Games.classic:
                case Games.rush:
                    if (event.button === 0)
                        this.inputMap[Key.LeftClick] = true;
                    else if (event.button === 2)
                        this.inputMap[Key.RightClick] = true;

                case Games.world:
                    if (this.isWorldPlaying && !this.isPointerLocked) {
                        const lockRequest = this.canvas.requestPointerLock() as Promise<void> | null;
                        if (lockRequest) lockRequest.catch(() => null);
                    }
            };
        });

        this.canvas.addEventListener("pointerup", (event) => {
            switch (this.actualGame) {
                case Games.classic:
                case Games.rush:
                    if (event.button === 0)
                        this.inputMap[Key.LeftClick] = false;
                    else if (event.button === 2)
                        this.inputMap[Key.RightClick] = false;
                    break;
            }
        });

    }
}
