import { Color3, CubeTexture, DirectionalLight, MeshBuilder, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Environment } from "../environment";
import { ToonMaterial } from "../../materials/toonMaterial";

/**
 * Bird minigame environment.\
 * Recreates the flappyBird game with kerby as the player.\
 * The player must run through the pipes to score points.\
 * The pipes are randomly (seeded) generated.\
 */
export class Bird extends Environment {
    private segmentWidth: number = 6;
    private segmentHeight: number = 30;
    private lastSegmentX: number = -this.segmentWidth;
    private passageHeight: number = 10;

    setupSkybox(): void {
        this.skybox.position = new Vector3(0, this.skyboxSize / 8, 0);
        const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("./assets/images/bird/skybox/", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.infiniteDistance = true;
    }

    async loadEnvironment(): Promise<void> {

        this.createText3D(new Vector3(20, 25, 0));

        for (let i = -2; i < 5; i++) {
            this.createGroundSegment(i * this.segmentWidth);
        }
        this.createPassage(this.lastSegmentX - 3 + this.segmentWidth + 15, 20);

    }

    setupLight(): void {
        const light = new DirectionalLight("dirLight", new Vector3(1, 1, -1), this.scene);
    }

    private createGroundSegment(x: number): void {

        const ground = MeshBuilder.CreateBox("groundSegment", {
            width: this.segmentWidth,
            depth: 20,
            height: this.segmentHeight
        }, this.scene);

        ground.position = new Vector3(x + this.segmentWidth / 2 + 10, 0, 0);
        ground.checkCollisions = true;
        ground.receiveShadows = true;

        const mat = new ToonMaterial("groundSegmentMaterial", new Texture("./assets/textures/cartoon-dirt.jpg", this.scene), this.scene);
        //Color of dirt for no texture
        //mat.diffuseColor = new Color3(0.5, 0.25, 0.1);
        ground.material = mat;

        this.pushGroundSegment(ground);
        this.lastSegmentX = x;
    }


    private createPassage(x: number, yOffset: number): void {
        const totalHeight = this.segmentHeight * 4;


        const topBlock = MeshBuilder.CreateCylinder("pipe", {
            diameter: this.segmentWidth,
            height: (totalHeight - this.passageHeight) / 2,
            tessellation: 20
        }, this.scene);
        const topBlockBottom = MeshBuilder.CreateCylinder("pipe", {
            diameter: this.segmentWidth + 2,
            height: 3,
            tessellation: 20
        }, this.scene);

        topBlock.position = new Vector3(x, (totalHeight + this.passageHeight) / 4 + yOffset, 0);
        topBlockBottom.position = new Vector3(x, this.passageHeight - 3.5 + yOffset, 0);
        topBlock.checkCollisions = true;
        topBlockBottom.checkCollisions = true;

        const bottomBlock = MeshBuilder.CreateCylinder("pipe", {
            diameter: this.segmentWidth,
            height: (totalHeight - this.passageHeight) / 2,
            tessellation: 20
        }, this.scene);
        const bottomBlockTop = MeshBuilder.CreateCylinder("pipe", {
            diameter: this.segmentWidth + 2,
            height: 3,
            tessellation: 20
        }, this.scene);

        bottomBlock.position = new Vector3(x, -(totalHeight + this.passageHeight) / 4 + yOffset, 0);
        bottomBlockTop.position = new Vector3(x, - this.passageHeight / 2 - 1.499 + yOffset, 0);
        bottomBlock.checkCollisions = true;
        bottomBlockTop.checkCollisions = true;

        const metal = new ToonMaterial("metalMaterial", new Color3(0.1, 0.5, 0.1), this.scene);

        //effet metallique
        // metal.setSpecularPower(256);

        topBlock.material = metal;
        topBlockBottom.material = metal;

        bottomBlock.material = metal;
        bottomBlockTop.material = metal;

        this.pushGroundSegment(topBlock);
        this.pushGroundSegment(topBlockBottom);

        this.pushGroundSegment(bottomBlock);
        this.pushGroundSegment(bottomBlockTop);

        this.lastSegmentX = x;

        const innerCylinder = MeshBuilder.CreateCylinder("pipe", {
            diameter: this.segmentWidth,
            height: 1,
            tessellation: 20
        }, this.scene);

        const topInnerCylinder = innerCylinder.clone();

        innerCylinder.position = new Vector3(x, -this.passageHeight / 2 - 0.498 + yOffset, 0);
        topInnerCylinder.position = new Vector3(x, this.passageHeight / 2 + 0.499 + yOffset, 0);

        const blackMaterial = new ToonMaterial("blackMaterial", new Color3(0, 0, 0), this.scene);
        innerCylinder.material = blackMaterial;
        topInnerCylinder.material = blackMaterial;
    }



    beforeRenderUpdate(): void {
        while (this.lastSegmentX < this.player.position.x + 50) {
            let random = this.random.random();

            if (random < 0.2) {
                this.createPassage(this.lastSegmentX + this.segmentWidth + 20, 18);
            } else if (random < 0.4 && random >= 0.2) {
                this.createPassage(this.lastSegmentX + this.segmentWidth + 20, 23);
            } else if (random < 0.6 && random >= 0.4) {
                this.createPassage(this.lastSegmentX + this.segmentWidth + 20, 16);
            } else if (random < 0.8 && random >= 0.6) {
                this.createPassage(this.lastSegmentX + this.segmentWidth + 20, 25);
            } else {
                this.createPassage(this.lastSegmentX + this.segmentWidth + 20, 10);
            }
        }
    }

    private createText3D(position: Vector3): void {
        const textPlane = MeshBuilder.CreatePlane("textPlane", { width: 14, height: 6 }, this.scene);
        textPlane.position = position;
        textPlane.billboardMode = 0;

        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(textPlane, 1024, 512);

        const textBlock = new TextBlock();
        textBlock.text = "Run through\nthe pipes to score!";
        textBlock.color = "white";
        textBlock.fontSize = 120;
        textBlock.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;

        advancedTexture.addControl(textBlock);
    }
}