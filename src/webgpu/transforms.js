import { mat4, vec3 } from '../../gl-matrix.js';

export function getRotationAxes() {
    return {
        x: vec3.fromValues(1.0, 0.0, 0.0), // pitch
        y: vec3.fromValues(0.0, 1.0, 0.0), // yaw
        z: vec3.fromValues(0.0, 0.0, 1.0), // roll
    };
}

export function transformationMatrix(position, rotation, scale) {
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

export function objectSpaceVectors(rotation) {
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