import { vec3, mat4 } from "../gl-matrix.js";

export function createCamera(info) {
    const projectionMatrix = createProjectionMatrixFromCreateCameraInfo(info);
    const viewMatrix = createViewMatrixFromCreateCameraInfo(info);

    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    // const cameraOption = {
    //     eye: cameraPosition,
    //     center: lookDirection,
    //     zoomMax: 100,
    //     zoomSpeed: 2,
    // };

    return {
        viewMatrix,
        projectionMatrix,
        viewProjectionMatrix,
        // cameraOption,
    };
}

function createProjectionMatrixFromCreateCameraInfo(info) {
    if (!info.fieldOfView) {
        info.fieldOfView = 2 * Math.PI / 5;
    }

    if (!info.aspectRatio) {
        info.aspectRatio = 1.0;
    }

    if (!info.nearClipping) {
        info.nearClipping = 0.1;
    }

    if (!info.farClipping) {
        info.farClipping = 100.0;
    }

    const projectionMatrix = mat4.create();       
    return mat4.perspective(projectionMatrix, info.fieldOfView, info.aspectRatio, info.nearClipping, info.farClipping);
}

function createViewMatrixFromCreateCameraInfo(info) {
    if (!info.position) {
        info.position = vec3.fromValues(0, 0, 0);
    }

    if (!info.upDirection) {
        info.upDirection = vec3.fromValues(0, 1, 0);
    }

    const viewMatrix = mat4.create();

    if (info.lookAt) {
        return mat4.lookAt(viewMatrix, info.position, info.lookAt, info.upDirection);
    }

    if (!info.rotation) {
        info.rotation = quat.fromValues(0, 0, 0, 0);
    }

    return mat4.fromQuat(viewMatrix, info.rotation);
}