import { createUnmappedFloat32Buffer, createUnmappedUint32Buffer, bufferUsageFlags } from '../webgpu/buffers.js';
import { vec3, mat4 } from '../../gl-matrix.js';

const objects = {};
const materials = {};

export function parseWaveFrontObject(device, obj) {
    let objName = "";
    let vPositions = [];
    let vTextureCoords = [];
    let vNormals = [];
    let indices = [];

    for (const line of obj.split("\n")) {
        if (line.startsWith("o ")) {
            objName = line.substr(2);
        }
        if (line.startsWith("v ")) {
            for (const num of line.substr(2).split(" ")) {
                vPositions.push(Number.parseFloat(num));
            }
        }
        if (line.startsWith("vt ")) {
            for (const num of line.substr(3).split(" ")) {
                vTextureCoords.push(Number.parseFloat(num));
            }
        }
        if (line.startsWith("vn ")) {
            for (const num of line.substr(3).split(" ")) {
                vNormals.push(Number.parseFloat(num));
            }
        }
        if (line.startsWith("f ")) {
            for (const face of line.substr(2).split(" ")) {
                const [vertexIndex, textureIndex, normalIndex] = face.split("/");
                indices.push(Number.parseInt(vertexIndex) - 1);
            }
        }
    }

    if (!objName)
        throw "No name for wavefront object";

    objects[objName] = {
        positions: createUnmappedFloat32Buffer(device, new Float32Array(vPositions), bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
        textureCoords: createUnmappedFloat32Buffer(device, new Float32Array(vTextureCoords), bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
        normals: createUnmappedFloat32Buffer(device, new Float32Array(vNormals), bufferUsageFlags.VERTEX | bufferUsageFlags.COPY_DST),
        indices: createUnmappedUint32Buffer(device, new Uint32Array(indices), bufferUsageFlags.INDEX | bufferUsageFlags.COPY_DST),
    };
}

export function parseWaveFrontMaterial(mtl) {

}

export function getWaveFrontModel(name) {
    if (!objects[name])
        throw "Model not found";

    return {
        position: vec3.fromValues(0, 0, 0),
        rotation: vec3.fromValues(0, 0, 0),
        scale: vec3.fromValues(1, 1, 1),
        modelMatrix: mat4.create(),
        buffers: {
            positions: objects[name].positions,
            normals: objects[name].normals,
            textureCoords: objects[name].textureCoords,
            index: objects[name].indices,
        },
    };
}