export async function loadResource(uri) {
    const response = await fetch(uri);
    
    if (!response.ok)
        throw "Failed to load resource";

    const resource = await response.text();
    return resource;
}