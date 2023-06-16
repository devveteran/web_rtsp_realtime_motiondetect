interface CONFIG{
    serverURL : string | undefined,
    mediaURL: string | undefined,
}
export const envData: CONFIG = {
    serverURL: "http://localhost:5010",
    mediaURL: "http://localhost:5020",
}
console.log(envData);
export const { serverURL, mediaURL} = envData;
