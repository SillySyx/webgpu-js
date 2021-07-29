export class GameState {
    uiComponents = [];
    entityComponents = [];
    cameraComponents = [];
    keyboard = null;

    update(frameTime) {
        for (const entity of this.entityComponents) {
            entity.update(this, frameTime);
        }
        for (const camera of this.cameraComponents) {
            camera.update(this, frameTime);
        }
        for (const ui of this.uiComponents) {
            ui.update(this, frameTime);
        }
    }
}