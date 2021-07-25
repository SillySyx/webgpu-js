const keysPressed = {};
const gamepads = [];

export function initInputs() {
    window.addEventListener("keydown", event => {
        event.preventDefault();
        event.stopPropagation();
        keysPressed[event.key] = true;
    });
    window.addEventListener("keyup", event => {
        event.preventDefault();
        event.stopPropagation();
        keysPressed[event.key] = false;
    });
    window.addEventListener("gamepadconnected", event => {
        console.log("gamepad connected", event.gamepad);
        gamepads[event.gamepad.index] = event.gamepad;
    });
    window.addEventListener("gamepaddisconnected", event => {
        console.log("gamepad disconnected", event.gamepad);
        delete gamepads[event.gamepad.index];
    });
}

export function isKeyPressed(key) {
    return keysPressed[key] == true;
}

export function isKeyReleased() {
    return keysPressed[key] == false;
}

export function getGamepadAxes(index) {
    if (!gamepads[index])
        return [false, null];

    return [true, gamepads[index].axes];
}

export function getGamepadButtons(index) {
    if (!gamepads[index])
        return [false, null];

    return [true, gamepads[index].buttons];
}