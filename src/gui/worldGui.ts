import { AdvancedDynamicTexture, Button, Grid, TextBlock } from "@babylonjs/gui";
import { LevelScene } from "../scenes/levelScene";

/**
 * The WorldGui class manages the user interface for the game world.\
 * It includes functionality for displaying stats, a pause menu, and toggling UI visibility.
 * @todo Implement stats and main UI functionality.
*/
export class WorldGui {
    /** The UI layer for world */
    private ui: AdvancedDynamicTexture;
    /** Grid for stats */
    private statGrid: Grid;
    /** Grid for the main UI */
    private uiGrid: Grid;
    /** Grid for the pause menu */
    private pauseGrid!: Grid;
    public isPaused = false;
    /**Flag to track if stats are visible*/
    private isStatActive = false; // 

    constructor(public scene: LevelScene) {
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("WorldGUI", true, this.scene, AdvancedDynamicTexture.NEAREST_SAMPLINGMODE, true);
        this.isVisible = false; // Disable the layer by default
        this.statGrid = this.makeStatGrid();

        this.uiGrid = new Grid("uiGrid");
        this.uiGrid.addColumnDefinition(0.25);
        this.uiGrid.addColumnDefinition(0.5);
        this.uiGrid.addColumnDefinition(0.25);
    }
    /**
     * Toggles the visibility of the pause grid.
     */
    public set PauseMenuVisibility(isVisible: boolean) {
        this.pauseGrid.isVisible = this.isPaused = isVisible;
    }

    /**
     * Toggles the visibility of the UI and updates the stat grid visibility accordingly.
     * Usually called when the player presses the toggle UI button.
     */
    toggleUIVisibility() {
        this.uiGrid.isVisible = !this.uiGrid.isVisible;
        if (this.isStatActive)
            this.statGrid.isVisible = this.uiGrid.isVisible;
    }
    get isStatVisible() {
        return this.isStatActive && this.statGrid.isVisible;
    }
    get isVisible() {
        return this.ui.layer!.isEnabled;
    }
    set isVisible(value: boolean) {
        this.ui.layer!.isEnabled = value;
    }

    private makeStatGrid(): Grid {
        const statMenu = new Grid("statGrid");
        statMenu.addColumnDefinition(0.3);
        statMenu.addColumnDefinition(0.4);
        statMenu.addColumnDefinition(0.3);
        const leftStat = new TextBlock("leftStat", "Left Stat");
        statMenu.addControl(leftStat, 0, 0);
        const rightStat = new TextBlock("rightStat", "Right Stat");
        statMenu.addControl(rightStat, 0, 2);
        return statMenu;
    }
    /**
     * @todo
     */
    updateStatGrid() { }

    makePauseMenu(resumeCallback: () => void) {
        // Create the main pause menu grid
        const pauseMenu = new Grid("pauseGrid");
        this.ui.addControl(pauseMenu);
        pauseMenu.color = "white";
        pauseMenu.background = "rgba(128, 128, 128, 0.4)";

        pauseMenu.addRowDefinition(0.25);       // 
        pauseMenu.addRowDefinition(0.29);       //
        pauseMenu.addRowDefinition(0.45);       //
        pauseMenu.addColumnDefinition(0.33);    //
        pauseMenu.addColumnDefinition(0.34);    //
        pauseMenu.addColumnDefinition(0.33);    //

        const menuTitle = new TextBlock("menuTitle", "Game Menu");

        pauseMenu.addControl(menuTitle, 0, 1);
        const buttonGrid = new Grid("buttonGrid");
        buttonGrid.addRowDefinition(0.33);
        buttonGrid.addRowDefinition(0.33);
        buttonGrid.addRowDefinition(0.33);
        pauseMenu.addControl(buttonGrid, 1, 1);

        const resumeButton = new Button("resumeButton");
        resumeButton.addControl(new TextBlock("resumeButtonText", "Resume Game"));
        buttonGrid.addControl(resumeButton, 0);
        const quitButton = new Button("quitButton");
        quitButton.addControl(new TextBlock("quitButtonText", "Return to Main Menu"));
        buttonGrid.addControl(quitButton, 2);
        const halfbuttonGrid = new Grid("halfbuttonGrid");
        buttonGrid.addControl(halfbuttonGrid, 1);
        halfbuttonGrid.addColumnDefinition(0.5);
        halfbuttonGrid.addColumnDefinition(0.5);
        halfbuttonGrid.addRowDefinition(1);
        const reportButton = new Button("reportButton");
        reportButton.addControl(new TextBlock("reportButtonText", "Report Bug"));
        halfbuttonGrid.addControl(reportButton, 0, 0);
        const saveButton = new Button("saveButton");
        saveButton.addControl(new TextBlock("saveButtonText", "Save Game"));
        halfbuttonGrid.addControl(saveButton, 0, 1);

        resumeButton.onPointerClickObservable.add(() => {
            resumeCallback();
        });

        quitButton.onPointerClickObservable.add(() => {
            window.addEventListener("beforeunload", (event) => {
                event.preventDefault(); // Prevent the default behavior
                event.returnValue = ""; // Show the confirmation dialog
                return "";
            }, { once: true });
            window.location.href = window.location.origin + window.location.pathname
        });

        reportButton.onPointerClickObservable.add(() => {
            window.open("https://github.com/Socrimoft/Kerby64/issues", "_blank");
        });

        saveButton.onPointerClickObservable.add(() => {
            // Logic to save the game
            console.log("Game saved...");
        });

        this.pauseGrid = pauseMenu;
        this.PauseMenuVisibility = false; // Show the pause menu
    }
}
