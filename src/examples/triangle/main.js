import { initCanvasContext, initDeviceAndSwapChain } from '../../webgpu/init.js';
import { createShaderModule } from '../../webgpu/shaders.js';

const vertexShaderCode = `
[[stage(vertex)]]
fn main([[builtin(vertex_index)]] VertexIndex: u32) -> [[builtin(position)]] vec4<f32> {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5));
        
    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}`;

const fragmentShaderCode = `
[[stage(fragment)]]
fn main() -> [[location(0)]] vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}`;

async function setup() {
    const [canvas, context] = initCanvasAndContext("webgpu-canvas");

    const swapChainFormat = "bgra8unorm";
    const [device, swapChain] = await initDeviceAndSwapChain(context, swapChainFormat);

    const vertexShaderModule = createShaderModule(device, vertexShaderCode);
    const fragmentShaderModule = createShaderModule(device, fragmentShaderCode);

    const renderPipelineInfo = {
        vertex: {
            module: vertexShaderModule,
            entryPoint: "main",
        },
        fragment: {
            module: fragmentShaderModule,
            entryPoint: "main",
            targets: [
                {
                    format: swapChainFormat,
                },
            ],
        },
        primitive: {
            topology: "triangle-list",
        },
    };
    const pipeline = device.createRenderPipeline(renderPipelineInfo);

    return [device, swapChain, pipeline];
}

function update() {
}

function draw(device, swapChain, pipeline) {
    const commandEncoder = device.createCommandEncoder();
    const textureView = swapChain.getCurrentTexture();
    
    const renderPassInfo = {
        colorAttachments: [
            {            
                view: textureView.createView(),
                loadValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 },
                storeOp: "store",
            },
        ],
    };
    const renderPass = commandEncoder.beginRenderPass(renderPassInfo);

    renderPass.setPipeline(pipeline);
    renderPass.draw(3, 1, 0, 0);
    renderPass.endPass();

    const commandBuffer = commandEncoder.finish();

    device.queue.submit([
        commandBuffer,
    ]);
}

const [device, swapChain, pipeline] = await setup();

function render() {
    update();
    draw(device, swapChain, pipeline);
    requestAnimationFrame(render);
}
render();