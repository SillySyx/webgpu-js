import { mat4, vec3, toRadian } from '../../gl-matrix.js';

import { initCanvasAndContext, initDeviceAndSwapChain } from '../../webgpu/init.js';
import { createShaderModule } from '../../webgpu/shaders.js';
import { bufferUsageFlags } from '../../webgpu/buffers.js';
import { textureUsageFlags } from '../../webgpu/textures.js';
import { objectSpaceVectors, transformationMatrix } from '../../webgpu/transforms.js';
import { initInputs, isKeyPressed, getGamepadAxes } from '../../webgpu/inputs.js';
import { calcFrameTime } from '../../webgpu/timeframe.js';
import { loadResource } from '../../webgpu/resources.js';
import { getWaveFrontModel, parseWaveFrontObject } from '../../webgpu/wavefront.js';



// RESOURCES

const modelObj = await loadResource("examples/mesh/model.obj");
const shaderCode = await loadResource("examples/mesh/shader.wsgl");
const ui = await loadResource("examples/camera/ui.html");


// SETUP

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
                    }
                ]
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
    },
    depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
    },
};
const pipeline = device.createRenderPipeline(renderPipelineInfo);

parseWaveFrontObject(device, modelObj);

const model = getWaveFrontModel("Model");

const aspectRatio = canvas.width / canvas.height;
const camera = {
    position: vec3.fromValues(0, 0, -5),
    rotation: vec3.fromValues(0, 0, 0),
    viewMatrix: mat4.create(),
    projectionMatrix: mat4.perspective(mat4.create(), toRadian(70), aspectRatio, 0.1, 100.0),
    viewProjectionMatrix: mat4.create(),
};

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



// GAME LOGIC

function resetCube() {
    camera.position = vec3.fromValues(0, 0, -5);
    camera.rotation = vec3.fromValues(0, 0, 0);
}

function update(frameTime) {
    const frameStep = frameTime / 1000;
    const cameraSpeed = 10 * frameStep;
    const rotateSpeed = 90 * frameStep;

    const maxRotation = toRadian(360);

    if (isKeyPressed("ArrowLeft")) {
        camera.rotation[1] -= toRadian(rotateSpeed);

        if (camera.rotation[1] < -maxRotation)
            camera.rotation[1] += maxRotation;
    }
    if (isKeyPressed("ArrowRight")) {
        camera.rotation[1] += toRadian(rotateSpeed);

        if (camera.rotation[1] > maxRotation)
            camera.rotation[1] -= maxRotation;
    }
    if (isKeyPressed("ArrowUp")) {
        camera.rotation[0] += toRadian(rotateSpeed);

        if (camera.rotation[0] > maxRotation)
            camera.rotation[0] -= maxRotation;
    }
    if (isKeyPressed("ArrowDown")) {
        camera.rotation[0] -= toRadian(rotateSpeed);

        if (camera.rotation[0] < -maxRotation)
            camera.rotation[0] += maxRotation;
    }

    const [gamepadConnected, axes] = getGamepadAxes(0);
    if (gamepadConnected && axes[3] != 0) {
        camera.rotation[1] += toRadian(axes[3] * rotateSpeed);
    }
    if (gamepadConnected && axes[4] != 0) {
        camera.rotation[0] += toRadian(axes[4] * rotateSpeed);
    }

    const cameraSpeedVectors = vec3.fromValues(cameraSpeed, cameraSpeed, cameraSpeed);
    const cameraSpaceVectors = objectSpaceVectors(camera.rotation);

    if (isKeyPressed("a")) {
        const left = vec3.create();
        vec3.multiply(left, cameraSpaceVectors.x, cameraSpeedVectors);
        vec3.add(camera.position, camera.position, left);
    }
    if (isKeyPressed("d")) {
        const right = vec3.create();
        vec3.negate(right, cameraSpaceVectors.x);
        vec3.multiply(right, right, cameraSpeedVectors);
        vec3.add(camera.position, camera.position, right);
    }
    if (isKeyPressed("w")) {
        const forward = vec3.create();
        vec3.multiply(forward, cameraSpaceVectors.z, cameraSpeedVectors);
        vec3.add(camera.position, camera.position, forward);
    }
    if (isKeyPressed("s")) {
        const backward = vec3.create();
        vec3.negate(backward, cameraSpaceVectors.z);
        vec3.multiply(backward, backward, cameraSpeedVectors);
        vec3.add(camera.position, camera.position, backward);
    }
    if (isKeyPressed(" ")) {
        const up = vec3.create();
        vec3.negate(up, cameraSpaceVectors.y);
        vec3.multiply(up, up, cameraSpeedVectors);
        vec3.add(camera.position, camera.position, up);
    }
    if (isKeyPressed("Control")) {
        const down = vec3.create();
        vec3.multiply(down, cameraSpaceVectors.y, cameraSpeedVectors);
        vec3.add(camera.position, camera.position, down);
    }

    if (gamepadConnected && axes[0] != 0) {
        const cameraSpeedFactor = axes[0] * cameraSpeed;
        const right = vec3.create();
        vec3.negate(right, cameraSpaceVectors.x);
        vec3.multiply(right, right, vec3.fromValues(cameraSpeedFactor, cameraSpeedFactor, cameraSpeedFactor));
        vec3.add(camera.position, camera.position, right);
    }
    if (gamepadConnected && axes[1] != 0) {
        const cameraSpeedFactor = axes[1] * cameraSpeed;
        const backward = vec3.create();
        vec3.negate(backward, cameraSpaceVectors.z);
        vec3.multiply(backward, backward, vec3.fromValues(cameraSpeedFactor, cameraSpeedFactor, cameraSpeedFactor));
        vec3.add(camera.position, camera.position, backward);
    }
    if (gamepadConnected && axes[2] > 0) {
        const cameraSpeedFactor = axes[2] * cameraSpeed;
        const down = vec3.create();
        vec3.multiply(down, cameraSpaceVectors.y, vec3.fromValues(cameraSpeedFactor, cameraSpeedFactor, cameraSpeedFactor));
        vec3.add(camera.position, camera.position, down);
    }
    if (gamepadConnected && axes[5] > 0) {
        const cameraSpeedFactor = axes[5] * cameraSpeed;
        const up = vec3.create();
        vec3.negate(up, cameraSpaceVectors.y);
        vec3.multiply(up, up, vec3.fromValues(cameraSpeedFactor, cameraSpeedFactor, cameraSpeedFactor));
        vec3.add(camera.position, camera.position, up);
    }

    model.modelMatrix = transformationMatrix(model.position, model.rotation, model.scale);
    camera.viewMatrix = transformationMatrix(camera.position, camera.rotation, vec3.fromValues(1, 1, 1));
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
            stencilStoreOp: "store"
        },
    };
    const renderPass = commandEncoder.beginRenderPass(renderPassInfo);

    const modelViewProjectionMatrix = updateModelViewProjectionMatrix(model.modelMatrix, camera.viewMatrix, camera.projectionMatrix);
    device.queue.writeBuffer(uniformBuffer, 0, modelViewProjectionMatrix);

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, model.buffers.positions);
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

    update(frameTime.ms);
    draw();

    requestAnimationFrame(render);
}

setInterval(() => {
    positionElement.innerHTML = `${camera.position[0]} ${camera.position[1]} ${camera.position[2]}`;
    rotationElement.innerHTML = `${camera.rotation[0]} ${camera.rotation[1]} ${camera.rotation[2]}`;
    fpsElement.innerHTML = `${Math.round(1000 / frameTime.ms)}fps ${frameTime.ms}ms`;
}, 250);

initInputs();
requestAnimationFrame(render);