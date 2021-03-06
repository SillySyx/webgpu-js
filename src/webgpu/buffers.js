export const bufferUsageFlags = {
    MAP_READ: 0x0001,
    MAP_WRITE: 0x0002,
    COPY_SRC: 0x0004,
    COPY_DST: 0x0008,
    INDEX: 0x0010,
    VERTEX: 0x0020,
    UNIFORM: 0x0040,
    STORAGE: 0x0080,
    INDIRECT: 0x0100,
    QUERY_RESOLVE: 0x0200,
};

export function createUnmappedFloat32Buffer(device, data, usageFlags) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlags,
        mappedAtCreation: true,
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    buffer.length = data.length;
    return buffer;
}

export function createUnmappedUint32Buffer(device, data, usageFlags) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlags,
        mappedAtCreation: true,
    });

    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    buffer.length = data.length;
    return buffer;
}