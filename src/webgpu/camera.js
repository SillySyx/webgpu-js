import { vec3, mat4, toRadian } from "../gl-matrix.js";
import { worldCoordinates, localCoordinates } from "./transforms.js";
import { KeyBindings } from '../../webgpu/keyboard.js';

export class FirstPersonCameraComponent {
    id = "";

    position = vec3.create();
    rotation = vec3.create();

    lookAtTarget = null;

    verticalFov = toRadian(70);
    aspectRatio = 1;
    nearClipping = 0.1;
    farClipping = 1000.0;

    viewMatrix = mat4.create();
    projectionMatrix = mat4.create();

    update(state, frameTime) {
        const frameStep = frameTime / 1000;

        this.updateKeyboardInputs(state, frameStep);
        // this.updateMouseInputs(frameStep);
        // this.updateControllerInputs(frameStep);

        this.updateViewMatrix(state);
    }

    updateProjectionMatrix() {
        this.projectionMatrix = mat4.create();

        mat4.perspective(this.projectionMatrix, this.verticalFov, this.aspectRatio, this.nearClipping, this.farClipping);
    }

    updateViewMatrix(state) {
        this.viewMatrix = mat4.create();

        const worldCoords = worldCoordinates();

        if (this.lookAtTarget) {
            const lookAtPosition = state.entityComponents.find(entity => entity.id === this.lookAtTarget);
            if (lookAtPosition) {
                mat4.lookAt(this.viewMatrix, this.position, lookAtPosition, worldCoords.y);
                return;
            }
        }

        const rotationMatrix = mat4.create();
        mat4.rotate(rotationMatrix, rotationMatrix, this.rotation[0], worldCoords.x); // pitch
        mat4.rotate(rotationMatrix, rotationMatrix, this.rotation[1], worldCoords.y); // yaw
        mat4.rotate(rotationMatrix, rotationMatrix, this.rotation[2], worldCoords.z); // roll

        const translationMatrix = mat4.create();
        mat4.translate(translationMatrix, translationMatrix, this.position);

        mat4.multiply(this.viewMatrix, this.viewMatrix, rotationMatrix);
        mat4.multiply(this.viewMatrix, this.viewMatrix, translationMatrix);
    }

    updateKeyboardInputs(state, frameStep) {
        const rotateSpeed = 90 * frameStep;
        if (state.keyboard.isKeyPressed(KeyBindings.RotateLeft)) {
            this.rotation[1] -= toRadian(rotateSpeed);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.RotateRight)) {
            this.rotation[1] += toRadian(rotateSpeed);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.RotateUp)) {
            this.rotation[0] -= toRadian(rotateSpeed);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.RotateDown)) {
            this.rotation[0] += toRadian(rotateSpeed);
        }
    
        const maxRotation = toRadian(360);
        for (const angle in this.rotation) {
            if (this.rotation[angle] < -maxRotation)
                this.rotation[angle] += maxRotation;

            if (this.rotation[angle] > maxRotation)
                this.rotation[angle] -= maxRotation;
        }


        const cameraSpeed = 10 * frameStep;
        const cameraSpeedVectors = vec3.fromValues(cameraSpeed, cameraSpeed, cameraSpeed);
        const cameraCoords = localCoordinates(this.rotation);

        if (state.keyboard.isKeyPressed(KeyBindings.MoveLeft)) {
            const left = vec3.create();
            vec3.multiply(left, cameraCoords.x, cameraSpeedVectors);
            vec3.add(this.position, this.position, left);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.MoveRight)) {
            const right = vec3.create();
            vec3.negate(right, cameraCoords.x);
            vec3.multiply(right, right, cameraSpeedVectors);
            vec3.add(this.position, this.position, right);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.MoveForward)) {
            const forward = vec3.create();
            vec3.multiply(forward, cameraCoords.z, cameraSpeedVectors);
            vec3.add(this.position, this.position, forward);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.MoveBackward)) {
            const backward = vec3.create();
            vec3.negate(backward, cameraCoords.z);
            vec3.multiply(backward, backward, cameraSpeedVectors);
            vec3.add(this.position, this.position, backward);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.MoveUp)) {
            const up = vec3.create();
            vec3.negate(up, cameraCoords.y);
            vec3.multiply(up, up, cameraSpeedVectors);
            vec3.add(this.position, this.position, up);
        }
        if (state.keyboard.isKeyPressed(KeyBindings.MoveDown)) {
            const down = vec3.create();
            vec3.multiply(down, cameraCoords.y, cameraSpeedVectors);
            vec3.add(this.position, this.position, down);
        }
    }
}
