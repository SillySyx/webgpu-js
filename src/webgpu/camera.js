import { vec3, mat4 } from "../gl-matrix.js";

export function createFirstPersonViewMatrix(rotation, position) {
    const viewMatrix = mat4.create();

    mat4.translate(viewMatrix, viewMatrix, position);
    mat4.rotateX(viewMatrix, viewMatrix, rotation[0]);
    mat4.rotateY(viewMatrix, viewMatrix, rotation[1]);
    mat4.rotateZ(viewMatrix, viewMatrix, rotation[2]);

    return viewMatrix;
}

export function createLookAtViewMatrix(position, lookAt, upDirection) {
    if (!upDirection) {
        upDirection = vec3.fromValues(0, 1, 0);
    }

    const viewMatrix = mat4.create();
    return mat4.lookAt(viewMatrix, position, lookAt, upDirection);
}