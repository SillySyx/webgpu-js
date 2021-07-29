export const KeyBindings = {
    MoveLeft: "a",
    MoveRight: "d",
    MoveUp: " ",
    MoveDown: "Control",
    MoveForward: "w",
    MoveBackward: "s",
    RotateLeft: "ArrowLeft",
    RotateRight: "ArrowRight",
    RotateUp: "ArrowUp",
    RotateDown: "ArrowDown",
};
const KeyBindingNames = Object.getOwnPropertyNames(KeyBindings);

export class KeyboardInputComponent {
    keysPressed = {};

    init() {
        window.addEventListener("keydown", event => {
            if (KeyBindingNames.some(key => KeyBindings[key] === event.key)) {
                // only capture keys that are used
                event.preventDefault();
                event.stopPropagation();

                this.keysPressed[event.key] = true;
            }
        });
        window.addEventListener("keyup", event => {
            if (KeyBindingNames.some(key => KeyBindings[key] === event.key)) {
                // only capture keys that are used
                event.preventDefault();
                event.stopPropagation();

                this.keysPressed[event.key] = false;
            }
        });
    }

    isKeyPressed(key) {
        return this.keysPressed[key];
    }
}


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