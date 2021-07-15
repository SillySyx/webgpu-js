import { mat4 } from "../gl-matrix.js";

export function initCanvasAndContext(id) {
    const canvas = document.getElementById(id);
    if (!canvas) {
        throw "failed to get canvas";
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext("gpupresent");
    if (!context) {
        throw "failed to get gpu context";
    }

    return [canvas, context];
}

export async function initDeviceAndSwapChain(context, swapChainFormat) {
    if (!navigator.gpu) {
        throw "browser don't support webgpu";
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw "failed to get gpu adapter";
    }

    const device = await adapter.requestDevice();
    if (!device) {
        throw "failed to get gpu device";
    }

    const swapChainInfo = {
        device: device,
        format: swapChainFormat,
    };
    const swapChain = context.configureSwapChain(swapChainInfo);
    if (!swapChain) {
        throw "failed to configureSwapChain";
    }

    return [device, swapChain];
}

export function createShaderModule(device, code) {
    const shaderModuleInfo = {
        code: code,
    };
    const module = device.createShaderModule(shaderModuleInfo);
    if (!module) {
        throw "failed to create shader module";
    }

    return module;
}