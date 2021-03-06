[[block]] struct Uniforms {
    modelViewProjectionMatrix : mat4x4<f32>;
};

[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

struct VertexInput {
    [[location(0)]] position: vec4<f32>;
    [[location(1)]] normal: vec3<f32>;
    [[location(2)]] uv: vec2<f32>;
};

struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(1)]] Normal: vec3<f32>;
    [[location(2)]] UV: vec2<f32>;
};

struct FragmentInput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(1)]] Normal: vec3<f32>;
    [[location(2)]] UV: vec2<f32>;
};

[[stage(vertex)]]
fn vMain(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * input.position;
    output.Normal = input.normal;
    output.UV = input.uv;
    return output;
}

[[stage(fragment)]]
fn fMain(input : FragmentInput) -> [[location(0)]] vec4<f32> {
    return vec4<f32>(0.8, 0.8, 0.8, 0.5);
}