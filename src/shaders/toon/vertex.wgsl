#include<sceneUboDeclaration>
#include<meshUboDeclaration>

#include<bonesDeclaration>
#include<instancesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

attribute position: vec3<f32>;
attribute normal: vec3<f32>;
attribute uv: vec2<f32>;

#ifdef USE_VERTEX_COLORS
attribute color: vec4<f32>;
#endif

#ifdef SHADOWS
uniform transformShadowMatrix: mat4x4<f32>;
#endif

varying vPositionW: vec3<f32>;
varying vNormalW: vec3<f32>;
varying vUV: vec2<f32>;
varying vColor: vec4<f32>;
varying vShadowCoord: vec4<f32>;

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    var positionUpdated = vertexInputs.position;
    var normalUpdated = vertexInputs.normal;
    var uvUpdated = vertexInputs.uv;

    #include<morphTargetsVertexGlobal>
    #include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

    #include<instancesVertex>

    #include<bonesVertex>

    let worldPos = finalWorld * vec4<f32>(positionUpdated, 1.0);

    vertexOutputs.vPositionW = worldPos.xyz;

    let normalWorld = mat3x3<f32>(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);
    vertexOutputs.vNormalW = normalize(normalWorld * vertexInputs.normal);

    vertexOutputs.position = scene.viewProjection * worldPos;
    vertexOutputs.vUV = vertexInputs.uv;

    #ifdef USE_VERTEX_COLORS
    vertexOutputs.vColor = vertexInputs.color;
    #else
    vertexOutputs.vColor = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    #endif

    #ifdef SHADOWS
    vertexOutputs.vShadowCoord = uniforms.transformShadowMatrix * vec4<f32>(worldPos.xyz, 1.0);
    #endif
}
