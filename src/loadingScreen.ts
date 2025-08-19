import { ILoadingScreen } from "@babylonjs/core";

/**
 * KerbyLoadingScreen is a custom loading screen for the Kerby game.\
 * Basically, it shows or hides a div that acts as a loading screen.
 * @implements {ILoadingScreen}
 */
export class KerbyLoadingScreen implements ILoadingScreen {
    public loadingUIBackgroundColor: string;
    private div: HTMLDivElement;
    private p: HTMLParagraphElement;
    private ptimeout: NodeJS.Timeout | null = null;

    constructor(public loadingUIText: string) {
        this.loadingUIBackgroundColor = "black";
        const div = document.getElementById("LoadingScreen");
        if (!(div instanceof HTMLDivElement)) throw new Error("LoadingScreen not found. Check your HTML.");
        this.div = div;
        this.p = div.querySelector("p") as HTMLParagraphElement;
        window.addEventListener("resize", this.resizeLoadingUI.bind(this));
        document.body.appendChild(this.div);
    }

    private get isVisible(): boolean {
        return this.div.checkVisibility() || false;
    }

    private resizeLoadingUI(event: UIEvent) {
        // this is a div, if there is css, it will be resized automatically
    }

    private displaystuckEngineMsg() {
        this.p.style.display = "initial";
    }

    public displayLoadingUI() {
        if (!this.isVisible) {
            this.div.style.display = "initial";
            return;
        }
    }

    public hideLoadingUI() {
        this.div.style.display = "none";
        if (this.ptimeout) {
            clearTimeout(this.ptimeout); // clear the timeout to prevent displaying the stuck message
            this.ptimeout = null;
        }
    }
}
