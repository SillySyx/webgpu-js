import { mat4, quat, vec3, toRadian } from '../../gl-matrix.js';

import { initCanvasAndContext, initDeviceAndSwapChain } from '../../webgpu/init.js';
import { createShaderModule } from '../../webgpu/shaders.js';
import { createUnmappedBuffer, bufferUsageFlags } from '../../webgpu/buffers.js';
import { textureUsageFlags } from '../../webgpu/textures.js';
import { initInputs, isKeyPressed, isKeyReleased } from '../../webgpu/inputs.js';
import { createFirstPersonViewMatrix } from '../../webgpu/camera.js';

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
    <p>Move camera using W,S,A,D,Space,Ctrl and Arrow keys</p>
    <button>Reset camera</button>
</div>`;

const cubeVertices = new Float32Array([
    // front
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    1, 1, 1,
    -1, 1, 1,
    -1, -1, 1,

    // right
    1, -1, 1,
    1, -1, -1,
    1, 1, -1,
    1, 1, -1,
    1, 1, 1,
    1, -1, 1,

    // back
    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    -1, -1, -1,

    // left
    -1, -1, 1,
    -1, 1, 1,
    -1, 1, -1,
    -1, 1, -1,
    -1, -1, -1,
    -1, -1, 1,

    // top
    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    1, 1, -1,
    -1, 1, -1,
    -1, 1, 1,

    // bottom
    -1, -1, 1,
    -1, -1, -1,
    1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, 1,
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
        rotation: vec3.fromValues(0, 0, 0),
        scale: vec3.fromValues(1, 1, 1),
        modelMatrix: mat4.create(),
        vertexBuffer: createUnmappedBuffer(device, cubeVertices, bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
        colorBuffer: createUnmappedBuffer(device, cubeColors, bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
    };

    const aspectRatio = canvas.width / canvas.height;
    const camera = {
        position: vec3.fromValues(-3, -1.5, -3),
        rotation: vec3.fromValues(toRadian(15), toRadian(-45), 0),
        viewMatrix: mat4.create(),
        projectionMatrix: mat4.perspective(mat4.create(), toRadian(70), aspectRatio, 0.1, 100.0),
        viewProjectionMatrix: mat4.create(),
    };

    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: bufferUsageFlags.UNIFORM | bufferUsageFlags.COPY_DST,
    });

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64,
            },
        }],
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


const [device, swapChain, pipeline, uniformBuffer, uniformBindGroup, depthTexture, cube, camera] = await setup();

const uiElement = document.createElement("div");
uiElement.innerHTML = ui;
uiElement.className = "ui-container";
uiElement.querySelector("button").addEventListener("click", event => resetCube());
document.body.appendChild(uiElement);

function update() {
    const rotateSpeed = .5;
    if (isKeyPressed("ArrowLeft")) {
        camera.rotation[1] -= toRadian(5 * rotateSpeed);
    }
    if (isKeyPressed("ArrowRight")) {
        camera.rotation[1] += toRadian(5 * rotateSpeed);
    }
    if (isKeyPressed("ArrowUp")) {
        camera.rotation[0] += toRadian(5 * rotateSpeed);
    }
    if (isKeyPressed("ArrowDown")) {
        camera.rotation[0] -= toRadian(5 * rotateSpeed);
    }
    
    const cameraSpeed = vec3.fromValues(.1, .1, .1);
    const cameraSpaceVectors = objectSpaceVectors(camera.rotation);

    if (isKeyPressed("a")) {
        const left = vec3.create();
        vec3.multiply(left, cameraSpaceVectors.x, cameraSpeed);
        vec3.add(camera.position, camera.position, left);
    }
    if (isKeyPressed("d")) {
        const right = vec3.create();
        vec3.negate(right, cameraSpaceVectors.x);
        vec3.multiply(right, right, cameraSpeed);
        vec3.add(camera.position, camera.position, right);
    }
    if (isKeyPressed("w")) {
        const forward = vec3.create();
        vec3.multiply(forward, cameraSpaceVectors.z, cameraSpeed);
        vec3.add(camera.position, camera.position, forward);
    }
    if (isKeyPressed("s")) {
        const backward = vec3.create();
        vec3.negate(backward, cameraSpaceVectors.z);
        vec3.multiply(backward, backward, cameraSpeed);
        vec3.add(camera.position, camera.position, backward);
    }
    if (isKeyPressed(" ")) {
        const up = vec3.create();
        vec3.negate(up, cameraSpaceVectors.y);
        vec3.multiply(up, up, cameraSpeed);
        vec3.add(camera.position, camera.position, up);
    }
    if (isKeyPressed("Control")) {
        const down = vec3.create();
        vec3.multiply(down, cameraSpaceVectors.y, cameraSpeed);
        vec3.add(camera.position, camera.position, down);
    }
}   

function draw() {
    cube.modelMatrix = transformationMatrix(cube.position, cube.rotation, cube.scale);
    camera.viewMatrix = transformationMatrix(camera.position, camera.rotation, vec3.fromValues(1, 1, 1));

    const modelViewProjectionMatrix = mat4.create();
    mat4.multiply(modelViewProjectionMatrix, cube.modelMatrix, modelViewProjectionMatrix);
    mat4.multiply(modelViewProjectionMatrix, camera.viewMatrix, modelViewProjectionMatrix);
    mat4.multiply(modelViewProjectionMatrix, camera.projectionMatrix, modelViewProjectionMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, modelViewProjectionMatrix);

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
    camera.position = vec3.fromValues(-3, -1.5, -3);
    camera.rotation = vec3.fromValues(toRadian(15), toRadian(-45), 0);
}

function render() {
    update();
    draw();
    requestAnimationFrame(render);
}
requestAnimationFrame(render);



function getRotationAxes() {
    return {
        x: vec3.fromValues(1.0, 0.0, 0.0), // pitch
        y: vec3.fromValues(0.0, 1.0, 0.0), // yaw
        z: vec3.fromValues(0.0, 0.0, 1.0), // roll
    };
}

function transformationMatrix(position, rotation, scale) {
    const axes = getRotationAxes();

    let rotationMatrix = mat4.create();
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[0], axes.x);
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[1], axes.y);
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[2], axes.z);

    let translationMatrix = mat4.create();
    mat4.translate(translationMatrix, translationMatrix, position);

    let scaleMatrix = mat4.create();
    mat4.scale(scaleMatrix, scaleMatrix, scale);

    let worldMatrix = mat4.create();
    mat4.multiply(worldMatrix, worldMatrix, rotationMatrix);
    mat4.multiply(worldMatrix, worldMatrix, translationMatrix);
    mat4.multiply(worldMatrix, worldMatrix, scaleMatrix);

    return worldMatrix;
}

function objectSpaceVectors(rotation) {
    const axes = getRotationAxes();

    let rotationMatrix = mat4.create();
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[0], axes.x);
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[1], axes.y);
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[2], axes.z);

    return {
        x: vec3.fromValues(rotationMatrix[0], rotationMatrix[4], rotationMatrix[8]),
        y: vec3.fromValues(rotationMatrix[1], rotationMatrix[5], rotationMatrix[9]),
        z: vec3.fromValues(rotationMatrix[2], rotationMatrix[6], rotationMatrix[10]),
    };
}