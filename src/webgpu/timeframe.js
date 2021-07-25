export function calcFrameTime(prevTime) {
    const time = Date.now();
    const ms = time - prevTime

    return {
        time: time,
        ms: ms,
    };
}