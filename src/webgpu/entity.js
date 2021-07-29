import { mat4, vec3 } from "../gl-matrix.js";
import { worldCoordinates } from "./transforms.js";

export class EntityComponent {
    position = vec3.create();
    rotation = vec3.create();
    scale = vec3.fromValues(1, 1, 1);

    modelMatrix = mat4.create();

    buffers = {
        vertex: null,
        normals: null,
        textureCoords: null,
        index: null,
    };

    update(state, frameTime) {
        this.updateModelMatrix();
    }

    updateModelMatrix() {
        const worldCoords = worldCoordinates();
    
        let rotationMatrix = mat4.create();
        mat4.rotate(rotationMatrix, rotationMatrix, this.rotation[0], worldCoords.x);
        mat4.rotate(rotationMatrix, rotationMatrix, this.rotation[1], worldCoords.y);
        mat4.rotate(rotationMatrix, rotationMatrix, this.rotation[2], worldCoords.z);
    
        let translationMatrix = mat4.create();
        mat4.translate(translationMatrix, translationMatrix, this.position);
    
        let scaleMatrix = mat4.create();
        mat4.scale(scaleMatrix, scaleMatrix, this.scale);
    
        mat4.multiply(this.modelMatrix, this.modelMatrix, rotationMatrix);
        mat4.multiply(this.modelMatrix, this.modelMatrix, translationMatrix);
        mat4.multiply(this.modelMatrix, this.modelMatrix, scaleMatrix);
    }
}