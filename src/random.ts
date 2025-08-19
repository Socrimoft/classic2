/**
 * Random number generator using a seeded algorithm.\
 * This implementation uses the SFC32 algorithm for generating pseudo-random numbers.
 * ```typescript
 * const random = new Random(12345); // Seed can be any number
 * console.log(random.random()); // Generates a random number between 0 and 1
 * console.log(random.rand()); // Generates a random integer between 0 and 4294967295
 * console.log(random.getSeed); // Retrieves the original seed used for random number generation
 * ```
 */
export class Random {
    /**
     * The seed used for random number generation.
     * This seed is XORed with a constant to obscure the original value.
     * @internal
     */
    private seed: number;

    constructor(seed: number) {
        this.seed = seed ^ 0xDEADBEEF;
        this.rand = Random.sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, this.seed);
        for (var i = 0; i < 15; i++) this.rand();
    }

    /**
     * @method
     * @returns pseudo-random integer between 0 and 4294967295.
     */
    public rand: () => number;

    /**
     * This is derived from the `rand` function.
     * @returns pseudo-random float between 0 and 1.
     */
    public random = () => this.rand() / 4294967296;

    /**
     * Retrieves the original seed used for random number generation.
     * The seed is XORed with a constant to obscure its original value.
     * @returns The original seed value.
     */
    public get getSeed() {
        return this.seed ^ 0xDEADBEEF; //apply xor op to reverse xor op
    }

    /**
     * @see https://pracrand.sourceforge.net/RNG_engines.txt
     * @internal
     */
    private static sfc32(a: number, b: number, c: number, d: number) {
        return function () {
            a |= 0; b |= 0; c |= 0; d |= 0;
            let t = (a + b | 0) + d | 0;
            d = d + 1 | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            c = c + t | 0;
            return (t >>> 0);
        }
    }
}
