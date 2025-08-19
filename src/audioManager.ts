import { AudioEngineV2, CreateAudioEngineAsync, CreateSoundAsync, IStaticSoundPlayOptions, StaticSound } from "@babylonjs/core";

/**
 * enum for sound file names.\
 * This enum is used to map sounds to their file names.
 */
enum SoundFileName {
    maintitle = "kerby.mp3",
    gameselect = "high_in_the_clouds.mp3",
    rush = "kerby.mp3",
    classicmenu = "high_in_the_clouds.mp3",
    classic1 = "run_ran_run.mp3",
    classic2 = "run_ran_run.mp3",
    classic3 = "run_ran_run.mp3",
    classic4 = "run_ran_run.mp3",
    classic5 = "run_ran_run.mp3",
    bird = "testosterone3.mp3",
    worldmenu = "high_in_the_clouds.mp3",
    world = "contemplation.mp3",
    cutscene = "farewell.mp3",
    gameover = "bonus.mp3",
}

type Sounds = keyof typeof SoundFileName;

/**
 * AudioManager class to manage audio in the game.\
 * It initializes the audio engine, loads sounds, and provides methods to play, stop, pause, and resume sounds.
 * @todo fix audio engine blocking game loading
 */
export class AudioManager {
    private readonly root = "/assets/audio/";
    private audioEngine: AudioEngineV2 = null as any;
    private sounds: Map<Sounds, StaticSound> = new Map<Sounds, StaticSound>();

    private readynessPromise: Promise<void>;

    constructor() {
        this.readynessPromise = new Promise<void>((resolve, reject) => {
            CreateAudioEngineAsync({ disableDefaultUI: true, volume: 0.5 }).then((engine) => {
                this.audioEngine = engine;
                console.log("Audio engine created successfully.");
                Promise.allSettled(Object.keys(SoundFileName).map(async (sound) => ([sound, await CreateSoundAsync(sound, this.root + SoundFileName[sound], undefined, engine)] as [Sounds, StaticSound]))).then((results) => {
                    this.sounds = new Map<Sounds, StaticSound>(results.filter(result => result.status === "fulfilled").map(result => result.value));
                    resolve();
                });
            }).catch((error) => {
                reject(error);
            });
        }).catch((error) => {
            console.error("Error creating audio engine:", error);
        });
    }

    public async init() {
        return this.readynessPromise;
    }

    public get Engine(): AudioEngineV2 {
        return this.audioEngine;
    }

    public async play(name: Sounds, options?: Partial<IStaticSoundPlayOptions>) {
        const sound = this.sounds.get(name);
        if (!sound) {
            console.error(`Sound ${name} not found`);
            return;
        }
        if (this.audioEngine.state === "suspended") {
            await this.audioEngine.unlockAsync();
        }
        if (this.audioEngine.state === "running") {
            sound.play(options);
        } else {
            console.error(`Audio engine is not running, cannot play sound ${name}`);
        }

    }

    public async stop(name: Sounds) {
        const sound = this.sounds.get(name);
        if (!sound) {
            console.error(`Sound ${name} not found`);
            return;
        }
        sound.stop();
    }

    public async pause() {
        await this.audioEngine.pauseAsync();
    }

    public async resume() {
        await this.audioEngine.resumeAsync();
    }

    public async unlock() {
        await this.audioEngine.unlockAsync();
    }

    public get state() {
        return this.audioEngine.state;
    }
}
