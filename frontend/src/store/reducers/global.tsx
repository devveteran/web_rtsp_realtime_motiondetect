import { CameraInfoType } from '@constants/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GlobalState {
    numCameras: number,
    cameras: Array<CameraInfoType>,
    fullView_camId: number,

    play_dir : string,
    play_files: Array<number>,

    all_playing: boolean,
    all_rewind: boolean,
    videoFinished: {[arg:number]:boolean},

    triggers: Array<number>,
}

const initialState: GlobalState = {
    numCameras: 10,
    cameras: [],
    fullView_camId: -1,

    play_dir: '',
    play_files: [],

    all_playing: true,
    all_rewind: false,
    videoFinished: {},
    triggers: [],
}

const GlobalSlice = createSlice({
    name: 'global',
    initialState,
    reducers: {
        setCameras: (state, action:PayloadAction<Array<CameraInfoType>>) => {
            // state.cameras = {...state.cameras, [action.payload.camIndex]:action.payload};
            state.cameras = [...action.payload];
        },
        setNumCameras: (state, action:PayloadAction<number>) => {
            console.log('paylod-', action.payload)
            state.numCameras = action.payload;
        },
        setFullViewCamId: (state, action:PayloadAction<number>) => {
            state.fullView_camId = action.payload;
        },
        setPlayDir: (state, action:PayloadAction<string>) => {
            state.play_dir = action.payload;
        },
        setPlayFiles: (state, action:PayloadAction<Array<number>>) => {
            state.play_files = [...action.payload];
        },
        setAllPlaying: (state, action:PayloadAction<boolean>) => {
            state.all_playing = action.payload;
        },
        setAllRewind: (state, action:PayloadAction<boolean>) => {
            state.all_rewind = action.payload;
        },
        setVideoFinished: (state, action:PayloadAction<{[arg:number]:boolean}>) => {
            state.videoFinished = {...action.payload};
        },
        setTriggers: (state, action:PayloadAction<Array<number>>) => {
            state.triggers = [...action.payload];
        },
    }
});

export const {  setCameras,
                setNumCameras,
                setFullViewCamId, setPlayDir,
                setPlayFiles,
                setAllPlaying, setAllRewind,
                setVideoFinished,
                setTriggers} = GlobalSlice.actions;
export default GlobalSlice.reducer;

