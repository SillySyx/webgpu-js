import { mat4, vec3, toRadian } from '../../gl-matrix.js';

import { initCanvasAndContext, initDeviceAndSwapChain } from '../../webgpu/init.js';
import { createShaderModule } from '../../webgpu/shaders.js';
import { bufferUsageFlags } from '../../webgpu/buffers.js';
import { textureUsageFlags } from '../../webgpu/textures.js';
import { KeyboardInputComponent } from '../../webgpu/keyboard.js';
import { calcFrameTime } from '../../webgpu/timeframe.js';
import { loadResource } from '../../webgpu/resources.js';
import { parseWaveFrontObject } from '../../webgpu/wavefront.js';
import { UiComponent } from '../../webgpu/ui.js';
import { EntityComponent } from '../../webgpu/entity.js';
import { FirstPersonCameraComponent } from '../../webgpu/camera.js';
import { GameState } from '../../webgpu/state.js';


// RESOURCES

const modelObj = await loadResource("examples/mesh/model.obj");
const shaderCode = await loadResource("examples/mesh/shader.wgsl");
const ui = await loadResource("examples/camera/ui.html");


// SETUP

const state = new GameState();


const uiElement = document.createElement("div");
uiElement.innerHTML = ui;
uiElement.className = "ui-container";
uiElement.querySelector("button").addEventListener("click", () => resetCube());
document.body.appendChild(uiElement);
const positionElement = uiElement.querySelector(".position");
const rotationElement = uiElement.querySelector(".rotation");
const fpsElement = uiElement.querySelector(".fps");

const [canvas, context] = initCanvasAndContext("webgpu-canvas");

const swapChainFormat = "bgra8unorm";
const [device, swapChain] = await initDeviceAndSwapChain(context, swapChainFormat);

const shaderModule = createShaderModule(device, shaderCode);

const renderPipelineInfo = {
    vertex: {
        module: shaderModule,
        entryPoint: "vMain",
        buffers: [
            {
                arrayStride: 3 * 4, // vec3
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    },
                ],
            },
            {
                arrayStride: 3 * 4, // vec3
                attributes: [
                    {
                        // normal
                        shaderLocation: 1,
                        offset: 0,
                        format: "float32x3"
                    },
                ],
            },
            {
                arrayStride: 2 * 4, // vec2
                attributes: [
                    {
                        // uv
                        shaderLocation: 2,
                        offset: 0,
                        format: "float32x2"
                    },
                ],
            },
        ],
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fMain",
        targets: [
            {
                format: swapChainFormat,
            },
        ],
    },
    primitive: {
        topology: "triangle-list",
        cullMode: 'back',
    },
    depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
    },
};
const pipeline = device.createRenderPipeline(renderPipelineInfo);

const [modelId, modelBuffers] = parseWaveFrontObject(device, modelObj);
const model = new EntityComponent();
model.id = modelId;
model.buffers = modelBuffers;

state.entityComponents.push(model);


const uniformBuffer = device.createBuffer({
    size: 16 * 4, // mat4
    usage: bufferUsageFlags.UNIFORM | bufferUsageFlags.COPY_DST,
});

const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: {
                buffer: uniformBuffer,
            },
        },
    ],
});

const depthTexture = device.createTexture({
    size: [
        canvas.width,
        canvas.height,
        1,
    ],
    format: "depth24plus",
    usage: textureUsageFlags.RENDER_ATTACHMENT,
});


const camera = new FirstPersonCameraComponent();
camera.id = "fpscam";
camera.aspectRatio = canvas.width / canvas.height;
camera.position = vec3.fromValues(0, 0, -5);
camera.updateProjectionMatrix();
state.cameraComponents.push(camera);

const keyboard = new KeyboardInputComponent();
keyboard.init();
state.keyboard = keyboard;


// GAME LOGIC

function resetCube() {
    camera.position = vec3.fromValues(0, 0, -5);
    camera.rotation = vec3.fromValues(0, 0, 0);
}


// RENDER LOGIC


function updateModelViewProjectionMatrix(modelMatrix, viewMatrix, projectionMatrix) {
    const modelViewProjectionMatrix = mat4.create();
    mat4.multiply(modelViewProjectionMatrix, modelMatrix, modelViewProjectionMatrix);
    mat4.multiply(modelViewProjectionMatrix, viewMatrix, modelViewProjectionMatrix);
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewProjectionMatrix);

    return modelViewProjectionMatrix;
}

function draw() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = swapChain.getCurrentTexture();

    const renderPassInfo = {
        colorAttachments: [
            {
                view: textureView.createView(),
                loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                storeOp: "store",
            },
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1.0,
            depthStoreOp: "store",
            stencilLoadValue: 0,
            stencilStoreOp: "store",
        },
    };
    const renderPass = commandEncoder.beginRenderPass(renderPassInfo);

    const modelViewProjectionMatrix = updateModelViewProjectionMatrix(model.modelMatrix, camera.viewMatrix, camera.projectionMatrix);
    device.queue.writeBuffer(uniformBuffer, 0, modelViewProjectionMatrix);

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, model.buffers.vertex);
    renderPass.setVertexBuffer(1, model.buffers.normals);
    renderPass.setVertexBuffer(2, model.buffers.textureCoords);
    renderPass.setIndexBuffer(model.buffers.index, "uint32");
    renderPass.setBindGroup(0, uniformBindGroup);

    renderPass.drawIndexed(model.buffers.index.length);
    renderPass.endPass();

    device.queue.submit([
        commandEncoder.finish(),
    ]);
}

let frameTime = calcFrameTime(Date.now());
function render() {
    frameTime = calcFrameTime(frameTime.time);

    state.update(frameTime.ms);

    draw();

    requestAnimationFrame(render);
}

setInterval(() => {
    positionElement.innerHTML = `${camera.position[0]} ${camera.position[1]} ${camera.position[2]}`;
    rotationElement.innerHTML = `${camera.rotation[0]} ${camera.rotation[1]} ${camera.rotation[2]}`;
    fpsElement.innerHTML = `${Math.round(1000 / frameTime.ms)}fps ${frameTime.ms}ms`;
}, 250);

requestAnimationFrame(render);