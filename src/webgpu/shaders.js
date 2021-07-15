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