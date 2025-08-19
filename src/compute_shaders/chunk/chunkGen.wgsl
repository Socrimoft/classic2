struct Uniforms {
    seed: i32,
    chunkSize: vec3<u32>,
    chunkCoord: vec2<i32>,
    worldType: u32,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read_write> blockBuffer: array<u32>;
@group(0) @binding(2) var<storage, read> flatWorldInfoBuffer: array<u32>;
@group(0) @binding(3) var<storage, read_write> buf: array<f32>;

fn noise_permute_vec2f(x: vec2<f32>) -> vec2<f32> {
    return (((x * 34.0) + 10.0) * x) % 289.0;
}

fn noise_fade_vec2f(x: vec2<f32>) -> vec2<f32> {
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

fn noise_permute_vec3f(x: vec3<f32>) -> vec3<f32> {
    return (((x * 34.0) + 10.0 + vec3f(f32(uniforms.seed))) * x) % 289.0;
}

fn noise_fade_vec3f(x: vec3<f32>) -> vec3<f32> {
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

fn noise_permute_vec4f(x: vec4<f32>) -> vec4<f32> {
    return (((x * 34.0) + 10.0 + vec4f(f32(uniforms.seed))) * x) % 289.0;
}

fn noise_fade_vec4f(x: vec4<f32>) -> vec4<f32> {
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

fn noise_perlin_vec2f(p: vec2<f32>) -> f32 {
    var pi = floor(p.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    pi = pi % 289.0;    // to avoid trauncation effects in permutation

    let pf = fract(p.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);

    let ix = pi.xzxz;
    let iy = pi.yyww;
    let fx = pf.xzxz;
    let fy = pf.yyww;

    let i = noise_permute_vec4f(noise_permute_vec4f(ix) + iy);

    var gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
    let gy = abs(gx) - 0.5 ;
    let tx = floor(gx + 0.5);
    gx = gx - tx;

    var g00 = vec2(gx.x, gy.x);
    var g10 = vec2(gx.y, gy.y);
    var g01 = vec2(gx.z, gy.z);
    var g11 = vec2(gx.w, gy.w);

    let norm = inverseSqrt(vec4(
        dot(g00, g00),
        dot(g01, g01),
        dot(g10, g10),
        dot(g11, g11)
    ));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;

    let n00 = dot(g00, vec2(fx.x, fy.x));
    let n10 = dot(g10, vec2(fx.y, fy.y));
    let n01 = dot(g01, vec2(fx.z, fy.z));
    let n11 = dot(g11, vec2(fx.w, fy.w));

    let fade_xy = noise_fade_vec2f(pf.xy);
    let n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    let n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

fn noise_perlin_vec3f(p: vec3<f32>) -> f32 {
    var pi0 = floor(p);     // Integer part for indexing
    var pi1 = pi0 + 1.0;    // Integer part + 1
    pi0 = pi0 % 289.0;
    pi1 = pi1 % 289.0;
    let pf0 = fract(p);     // Fractional part for interpolation
    let pf1 = pf0 - 1.0;    // Fractional part - 1.0
    let ix = vec4(pi0.x, pi1.x, pi0.x, pi1.x);
    let iy = vec4(pi0.yy, pi1.yy);
    let iz0 = pi0.zzzz;
    let iz1 = pi1.zzzz;

    let ixy = noise_permute_vec4f(noise_permute_vec4f(ix) + iy);
    let ixy0 = noise_permute_vec4f(ixy + iz0);
    let ixy1 = noise_permute_vec4f(ixy + iz1);

    var gx0 = ixy0 * (1.0 / 7.0);
    var gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    let gz0 = 0.5 - abs(gx0) - abs(gy0);
    let sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(vec4(0.0), gx0) - 0.5);
    gy0 -= sz0 * (step(vec4(0.0), gy0) - 0.5);

    var gx1 = ixy1 * (1.0 / 7.0);
    var gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    let gz1 = 0.5 - abs(gx1) - abs(gy1);
    let sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(vec4(0.0), gx1) - 0.5);
    gy1 -= sz1 * (step(vec4(0.0), gy1) - 0.5);

    var g000 = vec3(gx0.x, gy0.x, gz0.x);
    var g100 = vec3(gx0.y, gy0.y, gz0.y);
    var g010 = vec3(gx0.z, gy0.z, gz0.z);
    var g110 = vec3(gx0.w, gy0.w, gz0.w);
    var g001 = vec3(gx1.x, gy1.x, gz1.x);
    var g101 = vec3(gx1.y, gy1.y, gz1.y);
    var g011 = vec3(gx1.z, gy1.z, gz1.z);
    var g111 = vec3(gx1.w, gy1.w, gz1.w);

    let norm0 = inverseSqrt(vec4(
        dot(g000, g000),
        dot(g010, g010),
        dot(g100, g100),
        dot(g110, g110)
    ));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    let norm1 = inverseSqrt(vec4(
        dot(g001, g001),
        dot(g011, g011),
        dot(g101, g101),
        dot(g111, g111)
    ));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    let n000 = dot(g000, pf0);
    let n100 = dot(g100, vec3(pf1.x, pf0.yz));
    let n010 = dot(g010, vec3(pf0.x, pf1.y, pf0.z));
    let n110 = dot(g110, vec3(pf1.xy, pf0.z));
    let n001 = dot(g001, vec3(pf0.xy, pf1.z));
    let n101 = dot(g101, vec3(pf1.x, pf0.y, pf1.z));
    let n011 = dot(g011, vec3(pf0.x, pf1.yz));
    let n111 = dot(g111, pf1);

    let fade_xyz = noise_fade_vec3f(pf0);
    let n_z = mix(
        vec4(n000, n100, n010, n110),
        vec4(n001, n101, n011, n111),
        fade_xyz.z
    );
    let n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    let n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}


fn getBlockU32Index(gid: vec3<u32>) -> u32 {
    return gid.x + gid.y * uniforms.chunkSize.x + gid.z * uniforms.chunkSize.x * uniforms.chunkSize.y;
}

fn getRealCoord(gid: vec3<u32>) -> vec3f {
    return vec3f(f32(gid.x) + f32(uniforms.chunkCoord.x) * f32(uniforms.chunkSize.x),
                  f32(gid.y),
                  f32(gid.z) + f32(uniforms.chunkCoord.y) * f32(uniforms.chunkSize.z));
}

fn setBlockId(gid: vec3<u32>, id: u32) {
    let u32Index = getBlockU32Index(gid);
    blockBuffer[u32Index] = id;
}

@compute @workgroup_size(16, 1, 16)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    var localGid = gid;
    if (uniforms.worldType==0u) {
        for (var i: u32 = 0u; i < 5u; i++) {
            flat(localGid);
            localGid.y += 1u;
        }
        if (uniforms.seed==0) {
            debug(localGid);
        }
        return;
    }
    let globalPos = getRealCoord(gid);
    let temperature = noise_perlin_vec2f((globalPos.xz +  vec2f(f32(uniforms.seed),f32(uniforms.seed))*256.)/256.);
    let humidity = noise_perlin_vec2f((globalPos.xz +  vec2f(f32(-uniforms.seed),f32(uniforms.seed))*256.)/128.);
    let continentalness = noise_perlin_vec2f((globalPos.xz +  vec2f(f32(uniforms.seed),f32(-uniforms.seed))*256.)/64.);
    let erosion = noise_perlin_vec2f((globalPos.xz +  vec2f(f32(-uniforms.seed),f32(-uniforms.seed))*256.)/32.);
    let weirdness = noise_perlin_vec2f((globalPos.xz +  vec2f(f32(uniforms.seed),f32(uniforms.seed))*256.)/16.);
    let peaksandvalleys = 1. - abs(3.0 * abs(weirdness) - 2.0);
    let depth = 0.;

    for (var i: u32 = 0u; i < uniforms.chunkSize.y; i++) {
        normal(localGid);
        localGid.y += 1u;
    }
}

fn debug(gid: vec3<u32>) {
    if (uniforms.chunkCoord.x==0 && uniforms.chunkCoord.y==0 && gid.x%3==0 && gid.z%3==0) {
        let x = gid.x/3u;
        let z = gid.z/3u;

        setBlockId(gid,1u + x + u32(floor(f32(uniforms.chunkSize.x)/3.))*z);
    }
    //setBlockId(gid, 37u);
    //blockBuffer[u32Index] = 0xFFFFFFFFu;
}

fn flat(gid: vec3<u32>) {
    let u32Index = getBlockU32Index(gid);
    blockBuffer[u32Index] = (flatWorldInfoBuffer[gid.y >> 1] >> ((gid.y & 1) * 16u))& 0xFFFFu;
}

fn normal(gid: vec3<u32>) {
    if (gid.y > 64u) {
        return;
    }
    var p = getRealCoord(gid);
    let n = noise_perlin_vec3f(p/32.0);

    let u32Index = getBlockU32Index(gid);
    buf[u32Index] = n;
    if (n > 0.0) {
        blockBuffer[u32Index] = (gid.y%32u)+1;
    }
}