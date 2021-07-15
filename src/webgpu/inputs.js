const keysPressed = {};

export function initInputs() {
    document.addEventListener("keydown", event => {
        keysPressed[event.key] = true;
    });
    document.addEventListener("keyup", event => {
        keysPressed[event.key] = false;
    });
}

export function isKeyPressed(key) {
    return keysPressed[key] == true;
}

export function isKeyReleased() {
    return keysPressed[key] == false;
}