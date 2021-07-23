const keysPressed = {};

export function initInputs() {
    document.addEventListener("keydown", event => {
        event.preventDefault();
        event.stopPropagation();
        keysPressed[event.key] = true;
    });
    document.addEventListener("keyup", event => {
        event.preventDefault();
        event.stopPropagation();
        keysPressed[event.key] = false;
    });
}

export function isKeyPressed(key) {
    return keysPressed[key] == true;
}

export function isKeyReleased() {
    return keysPressed[key] == false;
}