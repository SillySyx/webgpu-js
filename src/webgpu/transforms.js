import { mat4, vec3 } from '../../gl-matrix.js';

export function worldCoordinates() {
    return {
        x: vec3.fromValues(1.0, 0.0, 0.0),
        y: vec3.fromValues(0.0, 1.0, 0.0),
        z: vec3.fromValues(0.0, 0.0, 1.0),
    };
}

export function localCoordinates(rotation) {
    const worldCoords = worldCoordinates();

    let rotationMatrix = mat4.create();
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[0], worldCoords.x);
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[1], worldCoords.y);
    mat4.rotate(rotationMatrix, rotationMatrix, rotation[2], worldCoords.z);

    return {
        x: vec3.fromValues(rotationMatrix[0], rotationMatrix[4], rotationMatrix[8]),
        y: vec3.fromValues(rotationMatrix[1], rotationMatrix[5], rotationMatrix[9]),
        z: vec3.fromValues(rotationMatrix[2], rotationMatrix[6], rotationMatrix[10]),
    };
}