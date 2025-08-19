import { Color3, Color4, DirectionalLight, DynamicTexture, LoadAssetContainerAsync, Mesh, PBRMaterial, Scene, Texture, UniversalCamera, Vector3, WebGPUEngine } from "@babylonjs/core";
import { Button, Control, Grid, ScrollViewer, StackPanel, TextBlock, Image, InputText } from "@babylonjs/gui";
import { Game } from "../game";
import { Menu } from "../gui/menu";
import { ToonMaterial } from "../materials/toonMaterial";

/**
 * MainMenuScene class represents the main menu of the game.
 * It extends the Scene class and initializes the main menu UI,
 * loads assets, and handles user interactions for starting the game or navigating to different modes.
 * @todo Show the pixar intro only the first time the game is started using sessionStorage.
 * @todo remake those menu using html/css instead of babylonjs gui.
 * @extends Scene
 */
export class MainMenuScene extends Scene {
    private indexOfClassicMode: number = 3;
    private indexOfWorldMode = 2;
    private canvas: HTMLCanvasElement;

    constructor(engine: WebGPUEngine) {
        super(engine);
        this.canvas = engine.getRenderingCanvas()!; // there is always a canvas
    }

    /**
     * Loads asynchronously the main menu scene by setting up the environment, lights, camera, and UI elements.
     * @returns A promise that resolves when the scene is fully loaded.
     */
    public async load(): Promise<void> {
        this.clearColor = new Color4(0.3215686274509804, 0.45490196078431374, 0.6784313725490196, 1);
        const light = new DirectionalLight("dirLight", new Vector3(0, 1, 1), this);
        light.intensity = 0.8;
        light.diffuse = new Color3(1, 0.95, 0.8);
        new UniversalCamera("Camera", new Vector3(0, 0, 0), this);
        this.createMainMenu();
    }

    /**
     * Callback function for the game selection menu.
     * It handles the user's selection of a game mode and navigates to the appropriate level selection or cutscene.
     */
    private gameSelectionCallback(menu: Menu, i: number) {
        menu.ui.dispose();
        switch (i) {
            case (this.indexOfClassicMode):
                this.createLevelSelectionMenu("Choose a level to play", ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"], this.classicSelectionCallback.bind(this));
                return;
            case (this.indexOfWorldMode):
                this.createWorldMenu();
                return;
            default:
                this.switchToCutScene(i + 1);
                return;
        }
    }

    /**
     * Callback to switch to the cutscene of the according classic level.
     */
    private classicSelectionCallback(menu: Menu, i: number) {
        menu.ui.dispose();
        this.switchToCutScene(this.indexOfClassicMode + 1, i);
    }

    /**
     * Creates the main menu UI with a title, start button, and GitHub link.
     * It plays background music and sets up the menu layout.
     * The start button navigates to the level selection menu.
     * @todo Add a background image to the main menu.
     */
    private createMainMenu(): void {
        Game.Instance.audio.play("maintitle", { loop: true });
        const guiMenu = new Menu("menu", 720);
        guiMenu.ui.onDisposeObservable.add(() => { Game.Instance.audio.stop("maintitle") });

        // guiMenu.addBackground("backgroundImage", "./assets/images/background.jpg");
        this.addGameTitleToMenu(guiMenu);
        guiMenu.addSimpleButton("start", "Start", "20%", "10%", "rgb(255,20,147)", "black", "-10%", "0px", 10, 0, Control.VERTICAL_ALIGNMENT_BOTTOM, Control.HORIZONTAL_ALIGNMENT_CENTER, () => {
            guiMenu.ui.dispose();
            this.createLevelSelectionMenu("Choose a game to play", ["Kirby Rush", "Kirby Bird", "Kirby World", "Kirby Classic"], this.gameSelectionCallback.bind(this));
        });
        guiMenu.addImageButton("github", "", "./assets/images/github.png", "40px", "40px", "40px", "40px", "", "black", "10px", "10px", 10, 0, Control.VERTICAL_ALIGNMENT_TOP, Control.HORIZONTAL_ALIGNMENT_LEFT, () => {
            window.open("https://github.com/Socrimoft/Kerby64");
        });
    }
    /**
     * Add the game title to the menu.
     */
    private addGameTitleToMenu(menu: Menu) {
        const verticalAlign = Control.VERTICAL_ALIGNMENT_CENTER;
        const horizontalAlign = Control.HORIZONTAL_ALIGNMENT_CENTER;
        const fontFamily = "WorldOfSpell";
        menu.addTextBlock("shadowK", "K", 60, "grey", "-30%", "-11%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("shadowE", "e", 60, "grey", "-30%", "-7.5%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("shadowR", "r", 60, "grey", "-30%", "-3.5%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("shadowB", "b", 60, "grey", "-30%", "0%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("shadowY", "y", 60, "grey", "-30%", "3.5%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("shadow6", "6", 60, "grey", "-30%", "7.5%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("shadow4", "4", 60, "grey", "-30%", "11%", verticalAlign, horizontalAlign, fontFamily);
        menu.addTextBlock("title", "Kerby64", 50, "white", "-30%", "0%", verticalAlign, horizontalAlign, fontFamily);

    }

    /**
     * Create a generic selection menu.\
     * This menu allows the user to select a game or level to play.\
     * It displays a title, a list of selectable items, and a button to play the selected item.\
     * The button callback function is called with the menu and the index of the selected item.
     */
    private createLevelSelectionMenu(title: string, selection: string[], buttonCallBack: (menu: Menu, i: number) => void): void {
        const songToPlay = title === "Choose a game to play" ? "gameselect" : "classicmenu";
        Game.Instance.audio.play(songToPlay, { loop: true });
        const levelSelectMenu = new Menu("levelSelectMenu", 720);
        levelSelectMenu.ui.onDisposeObservable.add(() => { Game.Instance.audio.stop(songToPlay) });

        levelSelectMenu.addTextBlock("title", title, 35, "white", "-45%", Control.VERTICAL_ALIGNMENT_CENTER, Control.HORIZONTAL_ALIGNMENT_CENTER)

        const levels = selection;

        const levelsScrollViewer = new ScrollViewer();
        levelsScrollViewer.width = "500px";
        levelsScrollViewer.height = "250px";
        levelsScrollViewer.top = "0%";

        const panel = new StackPanel();
        panel.isVertical = true;
        levelsScrollViewer.addControl(panel);

        for (let i = 0; i < levels.length; i++) {
            const row = new Grid();
            row.height = "35px";
            row.width = "500px";
            row.addColumnDefinition(0.33);
            row.addColumnDefinition(0.33);
            row.addColumnDefinition(0.33);

            const name = new TextBlock();
            name.text = levels[i];
            name.color = "white";
            name.fontSize = 14;
            name.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            name.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

            const starsCount = new TextBlock();
            starsCount.text = `${0} stars`;
            starsCount.color = "white";
            starsCount.fontSize = 14;

            const playLevelBtn = Button.CreateSimpleButton(i.toString(), "Play");
            playLevelBtn.width = "50px";
            playLevelBtn.height = "30px";
            playLevelBtn.cornerRadius = 10;
            playLevelBtn.color = "black";
            playLevelBtn.background = "rgb(50, 205, 50)";

            playLevelBtn.onPointerClickObservable.add(() => { buttonCallBack(levelSelectMenu, i) });

            row.addControl(name, i);
            row.addControl(starsCount, i, 1);
            row.addControl(playLevelBtn, i, 2);
            panel.addControl(row);
        }
        levelSelectMenu.ui.addControl(levelsScrollViewer);

        levelSelectMenu.addSimpleButton("mainmenu", "Return To Main Menu", "150px", "40px", "rgb(170, 74, 68)", "black", "-30px", 0, 10, 0, Control.VERTICAL_ALIGNMENT_BOTTOM, Control.HORIZONTAL_ALIGNMENT_CENTER, () => {
            levelSelectMenu.ui.dispose();
            this.createMainMenu();
        });
    }

    /**
     * Creates the world menu UI for selecting the world type and seed.
     * It allows the user to choose between a normal or flat world, enter a seed for world generation,
     * and start the game with the selected options.
     * The menu includes buttons for playing the game and going back to the main menu.
     */
    private async createWorldMenu() {
        Game.Instance.audio.play("worldmenu", { loop: true, startOffset: 27 });
        this.getEngine().displayLoadingUI();
        const worldfont = "WorldOfSpell";
        const gui = new Menu("world_setting", 1920);
        gui.ui.onDisposeObservable.add(() => { Game.Instance.audio.stop("worldmenu"); });

        let isWorldNormal = true;

        const backgroundTexture = new DynamicTexture("backgroundTexture", { width: this.canvas.width, height: this.canvas.height }, this, undefined, Texture.NEAREST_SAMPLINGMODE);
        const backgroundContext = backgroundTexture.getContext();
        let image = new window.Image();
        image.src = "./assets/images/world/blocks/dirt.png";
        await new Promise((resolve) => {
            image.onload = () => {
                for (let i = 0; i < this.canvas.width; i += 64) {
                    for (let j = 0; j < this.canvas.height; j += 64) {
                        backgroundContext.drawImage(image, i, j, 64, 64);
                    }
                }
                backgroundTexture.update(undefined, undefined, true);
                gui.addBackground("backgroundImage", backgroundContext.canvas.toDataURL("image/png"));
                resolve(true);
            };
        });

        const rows = new Grid("rows");
        gui.ui.addControl(rows);
        rows.addRowDefinition(0.2);
        rows.addRowDefinition(0.2);
        rows.addRowDefinition(0.2);
        rows.addRowDefinition(0.2);
        rows.addRowDefinition(0.2);
        const title = new TextBlock("world_title", "World");
        title.fontSize = "20%";
        title.color = "white";
        title.top = "5%";
        title.fontFamily = worldfont;
        rows.addControl(title, 0);

        const modeColumn = new Grid("mode");
        modeColumn.width = "80%";
        modeColumn.background = "grey";
        modeColumn.addColumnDefinition(0.5);
        modeColumn.addColumnDefinition(0.5);

        rows.addControl(modeColumn, 1);
        const WorldNormalBtn = new Button("WorldNormal");
        modeColumn.addControl(WorldNormalBtn, 0, 0);
        WorldNormalBtn.addControl(new TextBlock("Normal", "Normal"));
        WorldNormalBtn.thickness = 1;
        WorldNormalBtn.disabledColor = "grey";
        WorldNormalBtn.focusedColor = "white";
        WorldNormalBtn.background = "white";

        const WorldFlatBtn = new Button("WorldFlat");
        WorldFlatBtn.addControl(new TextBlock("Flat", "Flat"));
        WorldFlatBtn.thickness = 1;
        WorldFlatBtn.disabledColor = "grey";
        WorldFlatBtn.focusedColor = "white";
        WorldFlatBtn.background = "grey";
        modeColumn.addControl(WorldFlatBtn, 0, 1);

        // WorldNormalBtn.isEnabled is set to false when WorldNormal is selected
        WorldNormalBtn.onPointerClickObservable.add(() => {
            isWorldNormal = true;
            WorldFlatBtn.background = "grey";
            WorldNormalBtn.background = "white";
        });
        WorldFlatBtn.onPointerClickObservable.add(() => {
            isWorldNormal = false;
            WorldNormalBtn.background = "grey";
            WorldFlatBtn.background = "white";

        });
        //let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, this);
        //let loadedGUI = await advancedTexture.parseFromURLAsync("./assets/gui/world_setting.json");

        const seedGrid = new Grid("randomGrid");
        seedGrid.addColumnDefinition(0.25);
        seedGrid.addColumnDefinition(0.50);
        seedGrid.addColumnDefinition(0.25);
        const seedText = new TextBlock("seedText", "Seed : ");
        seedText.color = "white";
        seedGrid.addControl(seedText, 0, 0);
        const seedInput = new InputText("seedInput");
        seedInput.width = "80%";
        seedInput.placeholderText = "Enter a seed or leave it blank for random";
        seedInput.placeholderColor = "grey";
        seedInput.color = "white";
        seedInput.highlightedText = "white";
        seedGrid.addControl(seedInput, 0, 1);
        const seedRandomButton = new Button("seedRandomButton");
        const seedRandomImage = new Image("seedRandomImage", "");
        const seedRandomText = new TextBlock("seedRandomText", "Random");
        seedRandomButton.onPointerClickObservable.add(() => {
            seedInput.text = String(Math.floor(Math.random() * 1000000));
        })

        seedRandomButton.addControl(seedRandomImage);
        seedRandomButton.addControl(seedRandomText);
        seedRandomText.width = "100%";
        seedRandomButton.width = "80%";
        seedGrid.addControl(seedRandomButton, 0, 2);
        rows.addControl(seedGrid, 2, 0);

        const bottomGrid = new Grid("bottomGrid");
        bottomGrid.addColumnDefinition(0.5);
        bottomGrid.addColumnDefinition(0.5);


        const play = new Button("playbtn");
        const playText = new TextBlock("playText", "Play");
        play.addControl(playText);
        const seed = () => seedInput.text.length > 0 ? parseInt(seedInput.text, 36) : undefined;
        play.pointerUpAnimation = () => this.switchToCutScene("world", 1 + +isWorldNormal, seed());
        bottomGrid.addControl(play, 0, 1);
        play.paddingLeft = "10%";

        const back = new Button("backbtn");
        const backText = new TextBlock("backText", "Back to Main Menu");
        back.addControl(backText);
        back.pointerUpAnimation = () => {
            gui.ui.dispose();
            backgroundTexture.dispose();
            this.createLevelSelectionMenu("Choose a game to play", ["Kirby Rush", "Kirby Bird", "Kirby World", "Kirby Classic"], this.gameSelectionCallback.bind(this));
        };
        back.paddingRight = "10%";
        bottomGrid.addControl(back, 0, 0);
        rows.addControl(bottomGrid, 3, 0);
        this.getEngine().hideLoadingUI();
    }

    /**
     * Switches to a cutscene scene to load a specific level.
     */
    private switchToCutScene(levelToLoad: number | string, classicLevel?: number, seed?: number): void {
        this.detachControl();
        Game.Instance.audio.stop("maintitle");
        Game.Instance.switchToCutScene(levelToLoad, classicLevel, seed);
        this.dispose();
    }
}
