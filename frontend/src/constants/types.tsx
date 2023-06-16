export interface CameraInfoType {
    rtsp: string,
    name: string,
    description: string,
}
export const initialCameraInfo: CameraInfoType= {
    rtsp: "0.0.0.0",
    name: "",
    description: "",
}