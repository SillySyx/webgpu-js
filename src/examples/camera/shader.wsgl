[[block]] struct Uniforms {
    modelViewProjectionMatrix : mat4x4<f32>;
};

[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;

struct VertexInput {
    [[location(0)]] position: vec4<f32>;
    [[location(1)]] color: vec4<f32>;
};

struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] vColor : vec4<f32>;
};

struct FragmentInput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] vColor : vec4<f32>;
};

[[stage(vertex)]]
fn vMain(input : VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * input.position;
    output.vColor = input.color;
    return output;
}

[[stage(fragment)]]
fn fMain(input : FragmentInput) -> [[location(0)]] vec4<f32> {
    return input.vColor;
}