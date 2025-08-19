#include<sceneUboDeclaration>

struct Light {
    diffuse: vec3<f32>,
    intensity: f32,
    direction: vec3<f32>,
};

var<storage, read> lights: array<Light>;

uniform ambiantColor: vec4<f32>;
uniform specularColor: vec4<f32>;
uniform glossiness: f32;
uniform rimColor: vec4<f32>;
uniform rimAmount: f32;
uniform rimThreshold: f32;

var texture: texture_2d<f32>;
var textureSampler: sampler;

#ifdef SHADOWS
var shadowMap: texture_2d<f32>;
var shadowMapSampler: sampler;
#endif

varying vPositionW: vec3<f32>;
varying vNormalW: vec3<f32>;
varying vUV: vec2<f32>;
varying vColor: vec<f32>;

#ifdef SHADOWS
varying vShadowCoord: vec4<f32>;
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var finalColor = textureSample(texture, textureSampler, fragmentInputs.vUV) * fragmentInputs.vColor;

    #ifdef SHADOWS
    var shadowCoord = fragmentInputs.vShadowCoord;
    shadowCoord.xyz /= shadowCoord.w;
    shadowCoord.xy = shadowCoord.xy * 0.5 + 0.5;

    let shadowDepth = textureSample(shadowMap, shadowMapSampler, shadowCoord.xy).r;

    let currentDepth = shadowCoord.z;
    let shadowFactor = select(0.3, 1.0, currentDepth <= shadowDepth + 0.001);

    finalColor *= shadowFactor;
    #endif

    for (var i: u32 = 0; i < arrayLength(&lights); i++) {
        let NdotL = dot(lights[i].direction, normalize(fragmentInputs.vNormalW));
        let light = vec4<f32>(lights[i].diffuse, 1.0) * smoothstep(0.0, 0.01, NdotL) * lights[i].intensity;

        let viewDir = normalize((vec4<f32>(fragmentInputs.vPositionW, 1.0) * scene.viewProjection).xyz);
        let halfVector = normalize(lights[i].direction + viewDir);
        let NdotH = dot(fragmentInputs.vNormalW, halfVector);
        let specularIntensity = pow(NdotH * lights[i].intensity, uniforms.glossiness * uniforms.glossiness);
        let specularIntensitySmooth = smoothstep(0.005, 0.01, specularIntensity);
        let specular = specularIntensitySmooth * uniforms.specularColor;

        // let rimDot = 1.0 - dot(viewDir, fragmentInputs.vNormalW);
        // var rimIntensity = rimDot * pow(NdotL, uniforms.rimThreshold);
        // rimIntensity = smoothstep(uniforms.rimAmount - 0.01, uniforms.rimAmount + 0.01, rimIntensity);
        // let rim = uniforms.rimColor * rimIntensity;

        finalColor *= (uniforms.ambiantColor + light + specular);
    }

    fragmentOutputs.color = finalColor;
}
