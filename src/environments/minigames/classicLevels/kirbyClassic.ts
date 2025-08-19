import { Color3, CubeTexture, DirectionalLight, MeshBuilder, StandardMaterial, Texture, Vector3, TransformNode, Mesh } from "@babylonjs/core";
import { Environment } from "../../environment";
import { ToonMaterial } from "../../../materials/toonMaterial";
import { Portal } from "../../../actors/portal";

/**
 * KirClassic Environment Class
 * Remake of the first level of Kirby's Dream Land.\
 * This environment features a classic platformer style with ground segments, fences, logs.\
 * go though the portal at the end to finish the level.\
 */
export class KirClassic extends Environment {
    private segmentWidth: number = 6;
    private segmentHeight: number = 30;

    setupSkybox(): void {
        this.skybox.position = new Vector3(0, this.skyboxSize / 8, 0);
        const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("./assets/images/classic/skybox/", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.infiniteDistance = true;
    }

    setupLight() {
        const light = new DirectionalLight("dirLight", new Vector3(1, 1, -1), this.scene);
    }

    async loadEnvironment() {
        for (let i = -2; i < 88; i++) {

            if (![40, 41, 58, 59].includes(i))
                this.createGroundSegment(i * this.segmentWidth);
        }

        this.createGroundSegment(58 * this.segmentWidth, this.segmentHeight - 2);
        this.createGroundSegment(59 * this.segmentWidth, this.segmentHeight - 2);

        this.createFences(40);
        //enemy normal
        //enemy feu 
        //enemy herrisson 
        this.createFences(140);
        this.createBlock(145, 5, 6);
        //enemy blindé sur la box immobile
        this.createLog(160);
        //enemy feu sur la log pas immobile mais descendant pas
        //enemy herrisson  sous la log
        this.createLog(175);
        //enemy feu sur la log pas immobile mais descendant pas
        this.createFences(192);
        this.createMysteryBox(200);
        this.createLog(215);
        //enemy blindé sur la box immobile
        this.createLog(230);
        //enemy feu sur la log pas immobile mais descendant pas
        this.createWaterFences(40 * this.segmentWidth + 9.5, 2);
        this.createBridge(40 * this.segmentWidth + 3, 2);
        //enemy sauteur sur le pont
        //enemy herrisson apres pont
        //enemy sauteur apres pont
        this.createBlock(275, 6, 8);
        this.createBlock(278.2, 6, 5.3).rotation = new Vector3(0, 0, -Math.PI / 4);
        this.createBlock(281, 6, 4);
        //enemy sauteur sur partie basse
        //enemy blindé immobile
        //diamand
        //enemy blindé immobile
        this.createWaterFences(58 * this.segmentWidth + 9.5, 2);
        //enney normal
        this.createBlock(380, 12, 6);
        //enemy blindé immobile
        //enney normal
        this.createFences(405);
        this.createBlock(420, 6, 10);
        this.createMysteryBox(430);
        this.createBlock(440, 6, 10);
        this.createMysteryBox(450);
        this.createBlock(460, 6, 10);
        this.createFences(470);
        //enney normal
        //enemy sauteur
        this.createFences(480);
        this.createBlock(480, 4, 4);
        this.createBlock(490, 6, 8);
        this.createBlock(500, 4, 4);
        this.createFences(500);
        this.createWaterFences(530, 10);
        // quand kirby arrive en 534 fin du jeu

        const portal = new Portal(this.scene, false);
        await portal.instanciate(new Vector3(533.4, 13, 0), new Vector3(0, 240 * Math.PI / 180, 0), 2);
    }

    beforeRenderUpdate(): void {
    }

    private createGroundSegment(x: number, height?: number): void {

        const ground = MeshBuilder.CreateBox("groundSegment", {
            width: this.segmentWidth,
            depth: 20,
            height: height ? height : this.segmentHeight,
        }, this.scene);

        ground.position = new Vector3(x + this.segmentWidth / 2 + 0.01 + 10, 0, 0);
        ground.checkCollisions = true;
        ground.receiveShadows = true;

        const mat = new ToonMaterial("groundMaterial", new Texture("./assets/textures/cartoon-grass.jpg", this.scene), this.scene);
        //Color of dirt for no texture
        //mat.diffuseColor = new Color3(0.5, 0.25, 0.1);
        ground.material = mat;

        this.pushGroundSegment(ground);
        this.createPath(x, height);
    }

    private createFences(startX: number) {
        this.createFence(startX, 15.5, 5);
        this.createFence(startX, 15.5, -8);
    }

    private createFence(startX: number, startY: number, startZ: number) {
        const fence = new TransformNode("fence", this.scene);

        const plankMaterial = new StandardMaterial("plankMat", this.scene);
        plankMaterial.diffuseColor = new Color3(1, 1, 1); // Blanc

        // Création des poteaux
        for (let i = 0; i < 4; i++) {
            const post = MeshBuilder.CreateBox(`post${i}`, { width: 0.2, height: 1.2, depth: 0.2 }, this.scene);
            post.position = new Vector3(startX + i * 2, startY, startZ);
            post.material = plankMaterial;
            post.parent = fence;
        }

        // Création des lattes horizontales
        for (let j = -0.3; j <= 0.3; j += 0.6) {
            const plank = MeshBuilder.CreateBox(`plank${j}`, { width: 8, height: 0.15, depth: 0.2 }, this.scene);
            plank.position = new Vector3(startX + 3, startY + j, startZ);
            plank.material = plankMaterial;
            plank.parent = fence;
        }

        return fence;
    }

    private createPath(x: number, height?: number): void {
        const path = MeshBuilder.CreateBox("path", {
            width: this.segmentWidth,
            depth: 8,
            height: 1,
        }, this.scene);

        path.position = new Vector3(x + this.segmentWidth / 2 + 10, height ? height - 14.498 : 14.501, 0);
        const pathMaterial = new ToonMaterial("pathMaterial", new Texture("./assets/textures/cartoon-dirt.jpg", this.scene), this.scene);

        path.material = pathMaterial;
    }

    private createBlock(x: number, width: number, height: number): Mesh {
        const box = MeshBuilder.CreateBox("path", {
            width: width,
            depth: 6,
            height: height,
        }, this.scene);

        box.checkCollisions = true;
        box.receiveShadows = true;

        box.position = new Vector3(x + this.segmentWidth / 2 + 10, 14.501, 0);
        const boxMaterial = new ToonMaterial("boxMaterial", new Texture("./assets/textures/CarpetJPG.jpg", this.scene), this.scene);

        box.material = boxMaterial;
        return box;
    }

    private createLog(x: number): void {
        const log = MeshBuilder.CreateCylinder("log", {
            diameter: 6,
            height: 1,
            tessellation: 8
        }, this.scene);

        const topCinlinder = MeshBuilder.CreateCylinder("topCinlinder", {
            diameter: 5.5,
            height: 1,
            tessellation: 8
        }, this.scene);

        log.checkCollisions = true;
        log.receiveShadows = true;

        log.position = new Vector3(x + this.segmentWidth / 2 + 10, 20, 0);
        const logMaterial = new ToonMaterial("logMaterial", new Texture("./assets/textures/cartoon-wood.jpg", this.scene), this.scene);

        topCinlinder.position = new Vector3(x + this.segmentWidth / 2 + 10.005, 20.01, 0);
        const topMaterial = new ToonMaterial("topMaterial", new Texture("./assets/textures/TreeEndJPG.jpg", this.scene), this.scene);

        log.material = logMaterial;
        topCinlinder.material = topMaterial;
    }

    private createMysteryBox(x: number): void {
        const box = MeshBuilder.CreateBox("path", {
            width: 2,
            depth: 2,
            height: 2,
        }, this.scene);

        box.checkCollisions = true;
        box.receiveShadows = true;

        box.position = new Vector3(x + this.segmentWidth / 2 + 10, 20, 0);
        const boxMaterial = new ToonMaterial("mysteryBoxMaterial", new Texture("./assets/textures/Mistery.jpg", this.scene), this.scene);

        box.material = boxMaterial;
    }

    private createWaterFences(startX: number, length: number) {
        this.createWaterFence(startX, 15.5, 5);
        this.createWaterFence(startX, 15.5, -9);
        this.createWaterFence(startX + length * this.segmentWidth + 1, 15.5, 5);
        this.createWaterFence(startX + length * this.segmentWidth + 1, 15.5, -9);
    }

    private createWaterFence(startX: number, startY: number, startZ: number) {
        const fence = new TransformNode("fence", this.scene);

        // Création des poteaux
        for (let i = 0; i < 3; i++) {
            const post = MeshBuilder.CreateBox(`post${i}`, { width: 0.2, height: 1.2, depth: 0.2 }, this.scene);
            post.position = new Vector3(startX, startY, startZ + i * 2);
            const plankMaterial = new ToonMaterial("waterFenceMaterial", new Texture("./assets/textures/PlankJPG.jpg", this.scene), this.scene);
            post.material = plankMaterial;
            post.parent = fence;
        }

        // Création des lattes horizontales
        for (let j = -0.3; j <= 0.3; j += 0.6) {
            const plank = MeshBuilder.CreateBox(`plank${j}`, { width: 0.2, height: 0.15, depth: 5 }, this.scene);
            plank.position = new Vector3(startX, startY + j, startZ + 2);
            const plankMaterial = new ToonMaterial("plankMaterial", new Texture("./assets/textures/PlankJPG.jpg", this.scene), this.scene);
            plank.material = plankMaterial;
            plank.parent = fence;
        }

        return fence;
    }

    private createBridge(x: number, length: number): void {
        const floor = MeshBuilder.CreateBox("path", {
            width: length * this.segmentWidth,
            depth: 8,
            height: 0.5,
        }, this.scene);

        floor.position = new Vector3(x + this.segmentWidth / 2 + 10, 15, 0);
        const pathMaterial = new ToonMaterial("bridgeMaterial", new Texture("./assets/textures/PlankJPG.jpg", this.scene), this.scene);

        floor.material = pathMaterial;
        floor.checkCollisions = true;
        floor.receiveShadows = true;

        // Créer la rampe gauche (pour monter sur la plateforme)
        const leftRamp = MeshBuilder.CreateBox("leftRamp", {
            width: 4,
            depth: 8,
            height: 0.5,
        }, this.scene);

        leftRamp.position = new Vector3(x + 5.4, 14.25, 0);
        leftRamp.rotation = new Vector3(0, 0, Math.PI / 8);
        leftRamp.material = pathMaterial;
        leftRamp.checkCollisions = true;
        leftRamp.receiveShadows = true;

        // Créer la rampe droite (pour descendre de la plateforme)
        const rightRamp = MeshBuilder.CreateBox("rightRamp", {
            width: 4,
            depth: 8,
            height: 0.5,
        }, this.scene);

        rightRamp.position = new Vector3(x + (length * this.segmentWidth) + 8.8, 14.3, 0);
        rightRamp.rotation = new Vector3(0, 0, -Math.PI / 8);
        rightRamp.material = pathMaterial;
        rightRamp.checkCollisions = true;
        rightRamp.receiveShadows = true;
        this.createElongatedPyramid(length * this.segmentWidth, 1.5, new Vector3(x + this.segmentWidth / 2 + 10, 15.25, 3.5));
        this.createElongatedPyramid(length * this.segmentWidth, 1.5, new Vector3(x + this.segmentWidth / 2 + 10, 15.25, -3.5));
    }

    private createElongatedPyramid(length: number, height: number, position: Vector3): void {
        // Créer un prisme triangulaire en utilisant un cylindre avec 3 côtés
        const prism = MeshBuilder.CreateCylinder("prism", {
            height: length,
            diameter: height,
            tessellation: 3,
        });

        prism.position = position;
        prism.rotation = new Vector3(0, 0, Math.PI / 2);
        const prismMaterial = new ToonMaterial("elongatedPyramidMaterial", new Texture("./assets/textures/PlankJPG.jpg", this.scene), this.scene);
        prism.material = prismMaterial;
        prism.receiveShadows = true;
    }
}
