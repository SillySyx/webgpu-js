import { vec3, mat4 } from "../gl-matrix.js";

export function createProjectionMatrix(aspectRatio, fieldOfView, nearClipping, farClipping) {
    const projectionMatrix = mat4.create();
    return mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, nearClipping, farClipping);
}

export function createViewMatrix(rotation, position, upDirection) {
    if (!upDirection) {
        upDirection = vec3.fromValues(0, 1, 0);
    }

    const viewMatrix = mat4.create();
    return mat4.fromRotationTranslation(viewMatrix, rotation, position);
}

export function createLookAtViewMatrix(position, lookAt, upDirection) {
    if (!upDirection) {
        upDirection = vec3.fromValues(0, 1, 0);
    }

    const viewMatrix = mat4.create();
    return mat4.lookAt(viewMatrix, position, lookAt, upDirection);
}

// export function createCamera(info) {
//     const projectionMatrix = createProjectionMatrixFromCreateCameraInfo(info);
//     const viewMatrix = createViewMatrixFromCreateCameraInfo(info);
//     const viewProjectionMatrix = mat4.create();

//     return {
//         viewMatrix,
//         projectionMatrix,
//         viewProjectionMatrix,
//     };
// }

function createProjectionMatrixFromCreateCameraInfo(info) {
    if (!info.fieldOfView) {
        info.fieldOfView = (2 * Math.PI) / 5;
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