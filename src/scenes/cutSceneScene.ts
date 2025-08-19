import { Color4, FreeCamera, Scene, Vector3, WebGPUEngine } from "@babylonjs/core";
import { Control } from "@babylonjs/gui";
import { Game } from "../game";
import { Menu } from "../gui/menu";

/**
 * This class is used to display a cutscene before the game.\
 * It extends the Scene class from Babylon.js and uses the WebGPUEngine for rendering.\
 */
export class CutSceneScene extends Scene {
    constructor(engine: WebGPUEngine) {
        super(engine);
    }

    /**
     * Load the cutscene scene based on the game type.\
     * It sets up the camera, background, and buttons for the cutscene.\
     * It also plays background audio and handles the transition to the game level.\
     */
    public async load(game: number | string) {
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this);
        camera.setTarget(Vector3.Zero());
        this.clearColor = new Color4(0, 0, 0, 1);
        Game.Instance.audio.play("cutscene", { loop: true });
        const cutScene = new Menu("cutscene", 720);
        cutScene.ui.onDisposeObservable.add(() => { Game.Instance.audio.stop("cutscene") });
        if (typeof game === "string") game = game.toLowerCase();
        switch (game) {
            case 2:
            case "bird":
                cutScene.addBackground("cutscene", "assets/images/cutscene/kirbybirdTrasition.png");
                cutScene.addSimpleButton("next", "Next", "100px", "40px", "rgb(124,252,0)", "black", "-20px", "-60px", 10, 0,
                    Control.VERTICAL_ALIGNMENT_BOTTOM, Control.HORIZONTAL_ALIGNMENT_RIGHT, this.exitCutScene.bind(this));
                break;
            case 3:
            case "world":
                return this.exitCutScene();
            //cutScene.addSimpleButton("next", "Next", "100px", "40px", "rgb(124,252,0)", "black", "-20px", "-60px", 10, 0,
            //    Control.VERTICAL_ALIGNMENT_BOTTOM, Control.HORIZONTAL_ALIGNMENT_RIGHT, this.exitCutScene.bind(this));
            //break;
            case 4:
            case "classic":
                cutScene.addSimpleButton("next", "Next", "100px", "40px", "rgb(124,252,0)", "black", "-20px", "-60px", 10, 0,
                    Control.VERTICAL_ALIGNMENT_BOTTOM, Control.HORIZONTAL_ALIGNMENT_RIGHT, this.exitCutScene.bind(this));
                break;
            default: // rush
                cutScene.addSimpleButton("next", "Next", "100px", "40px", "rgb(124,252,0)", "black", "-20px", "-60px", 10, 0,
                    Control.VERTICAL_ALIGNMENT_BOTTOM, Control.HORIZONTAL_ALIGNMENT_RIGHT, this.exitCutScene.bind(this));
        }

    }

    /**
     * Detaches the control from the cutscene and switches to the game level.\
     * It also disposes the cutscene resources.
     */
    private exitCutScene() {
        this.detachControl();
        Game.Instance.switchToLevel();
        this.dispose();
    }
}
