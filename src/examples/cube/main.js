import { mat4, quat, vec3, toRadian } from '../../gl-matrix.js';

import { initCanvasAndContext, initDeviceAndSwapChain } from '../../webgpu/init.js';
import { createShaderModule } from '../../webgpu/shaders.js';
import { createUnmappedBuffer, bufferUsageFlags } from '../../webgpu/buffers.js';
import { textureUsageFlags } from '../../webgpu/textures.js';
import { createLookAtViewMatrix, createProjectionMatrix, createViewMatrix } from '../../webgpu/camera.js';
import { initInputs, isKeyPressed, isKeyReleased } from '../../webgpu/inputs.js';

const vertexShaderCode = `
[[block]] struct Uniforms {
    mvpMatrix : mat4x4<f32>;
};

[[binding(0), group(0)]] var<uniform> uniforms : Uniforms;
struct Output {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] vColor : vec4<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] pos: vec4<f32>, [[location(1)]] color: vec4<f32>) -> Output {
    var output: Output;
    output.Position = uniforms.mvpMatrix * pos;
    output.vColor = color;
    return output;
}`;

const fragmentShaderCode = `
[[stage(fragment)]]
fn main([[location(0)]] vColor: vec4<f32>) -> [[location(0)]] vec4<f32> {
    return vColor;
}`;

const ui = `
<div class="message-box">
    <p>Move cube using W A S D keys</p>
    <button>Reset</button>
</div>
<div class="message-box">
    <p class="cube-cords"></p>
</div>`;

const cubeVertices = new Float32Array([
        // front
        -1, -1,  1,  
         1, -1,  1,  
         1,  1,  1,
         1,  1,  1,
        -1,  1,  1,
        -1, -1,  1,

        // right
         1, -1,  1,
         1, -1, -1,
         1,  1, -1,
         1,  1, -1,
         1,  1,  1,
         1, -1,  1,

        // back
        -1, -1, -1,
        -1,  1, -1,
         1,  1, -1,
         1,  1, -1,
         1, -1, -1,
        -1, -1, -1,

        // left
        -1, -1,  1,
        -1,  1,  1,
        -1,  1, -1,
        -1,  1, -1,
        -1, -1, -1,
        -1, -1,  1,

        // top
        -1,  1,  1,
         1,  1,  1,
         1,  1, -1,
         1,  1, -1,
        -1,  1, -1,
        -1,  1,  1,

        // bottom
        -1, -1,  1,
        -1, -1, -1,
         1, -1, -1,
         1, -1, -1,
         1, -1,  1,
        -1, -1,  1,
]);

const cubeColors = new Float32Array([
    // front - blue
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // right - red
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    //back - yellow
    1, 1, 0,
    1, 1, 0,
    1, 1, 0,
    1, 1, 0,
    1, 1, 0,
    1, 1, 0,

    //left - aqua
    0, 1, 1,
    0, 1, 1,
    0, 1, 1,
    0, 1, 1,
    0, 1, 1,
    0, 1, 1,

    // top - green
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // bottom - fuchsia
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
]);

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
            buffers: [
                {
                    arrayStride: 12,
                    attributes: [
                        {
                            shaderLocation: 0,
                            format: "float32x3",
                            offset: 0,
                        },
                    ],
                },
                {
                    arrayStride: 12,
                    attributes: [
                        {
                            shaderLocation: 1,
                            format: "float32x3",
                            offset: 0,
                        },
                    ],
                },
            ],
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
            cullMode: "back",
        },
        depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less",
        },
    };
    const pipeline = device.createRenderPipeline(renderPipelineInfo);
 
    const cube = {
        position: vec3.fromValues(0, 0, 0),
        rotation: quat.fromValues(0, 0, 0, 1),
        scale: vec3.fromValues(1, 1, 1),
        matrix: mat4.create(),
        vertexBuffer: createUnmappedBuffer(device, cubeVertices, bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
        colorBuffer: createUnmappedBuffer(device, cubeColors, bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
    };

    const aspectRatio = canvas.width / canvas.height;
    const camera = {
        position: vec3.fromValues(-2, -2, -5),
        rotation: quat.fromEuler(quat.create(), 0, 0, 0),
        viewMatrix: mat4.create(),
        projectionMatrix: createProjectionMatrix(aspectRatio, (2 * Math.PI) / 5, 0.1, 100.0),
        viewProjectionMatrix: mat4.create(),
    };

    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: bufferUsageFlags.UNIFORM | bufferUsageFlags.COPY_DST
    });

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64
            }
        }]
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

    return [device, swapChain, pipeline, uniformBuffer, uniformBindGroup, depthTexture, cube, camera];
}

const modelViewMatrix = mat4.create();

const [device, swapChain, pipeline, uniformBuffer, uniformBindGroup, depthTexture, cube, camera] = await setup();

function update() {
    if (isKeyPressed("a")) {
        const cameraMatrix = mat4.create();
        mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
        mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(0.1, 0, 0))
        mat4.getTranslation(camera.position, cameraMatrix);
    }
    if (isKeyPressed("d")) {
        const cameraMatrix = mat4.create();
        mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
        mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(-0.1, 0, 0))
        mat4.getTranslation(camera.position, cameraMatrix);
    }
    if (isKeyPressed("w")) {
        const cameraMatrix = mat4.create();
        mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
        mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(0, 0, 0.1))
        mat4.getTranslation(camera.position, cameraMatrix);
    }
    if (isKeyPressed("s")) {
        const cameraMatrix = mat4.create();
        mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
        mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(0, 0, -0.1))
        mat4.getTranslation(camera.position, cameraMatrix);
    }
    if (isKeyPressed(" ")) {
        const cameraMatrix = mat4.create();
        mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
        mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(0, -0.1, 0))
        mat4.getTranslation(camera.position, cameraMatrix);
    }
    if (isKeyPressed("Control")) {
        const cameraMatrix = mat4.create();
        mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
        mat4.translate(cameraMatrix, cameraMatrix, vec3.fromValues(0, 0.1, 0))
        mat4.getTranslation(camera.position, cameraMatrix);
    }
    if (isKeyPressed("ArrowLeft")) {
        quat.rotateY(camera.rotation, camera.rotation, toRadian(3));
    }
    if (isKeyPressed("ArrowRight")) {
        quat.rotateY(camera.rotation, camera.rotation, toRadian(-3));
    }

    // camera.viewMatrix = createLookAtViewMatrix(camera.position, cube.position);
    camera.viewMatrix = createViewMatrix(camera.rotation, camera.position);
    mat4.multiply(camera.viewProjectionMatrix, camera.projectionMatrix, camera.viewMatrix);

    mat4.fromRotationTranslationScale(cube.matrix, cube.rotation, cube.position, cube.scale);
    mat4.multiply(modelViewMatrix, cube.matrix, camera.viewProjectionMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, modelViewMatrix);
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

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, cube.vertexBuffer);
    renderPass.setVertexBuffer(1, cube.colorBuffer);
    renderPass.setBindGroup(0, uniformBindGroup);

    const numberOfVertices = cubeVertices.length / 3;
    renderPass.draw(numberOfVertices);
    renderPass.endPass();

    device.queue.submit([
        commandEncoder.finish(),
    ]);
}

initInputs();

function resetCube() {
    camera.position[0] = -2;
    camera.position[1] = -2;
    camera.position[2] = -5;
}

const uiElement = document.createElement("div");
uiElement.innerHTML = ui;
uiElement.className = "ui-container";
uiElement.querySelector("button").addEventListener("click", event => resetCube());
document.body.appendChild(uiElement);

function render() {
    update();
    draw();
    requestAnimationFrame(render);
}
requestAnimationFrame(render);