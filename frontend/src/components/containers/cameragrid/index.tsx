// import CameraBox from "@organisms/camerabox";
import CameraBox from "@organisms/camerabox";
import { RootState } from "@store/index";
import { useDispatch, useSelector } from "react-redux";

import "./style.css";
import { Style } from "util";
import { memo, useEffect } from "react";
import { mediaURL } from "@services/server";
// import { setCapture } from "@store/reducers/global";

interface PropType {
    rows: number,
    cols: number,
    camIds: Array<number>,
    fullView?: boolean,
    // play_dir: string,
}

const CameraGrid = ({rows, cols, camIds, fullView} : PropType) => {
    // const gridColumns = useSelector((state:RootState) => state.global.gridColumns);
    const numCameras = useSelector((state:RootState) => state.global.numCameras);
    const cameras = useSelector((state:RootState) => state.global.cameras);
    const play_dir = useSelector((state:RootState) => state.global.play_dir);
    const play_files = useSelector((state:RootState) => state.global.play_files);
    const fullView_camId = useSelector((state:RootState) => state.global.fullView_camId);
    const dispatch = useDispatch();
    
    return (
        <div className={`camera-grid ${fullView === true ? 'fullview' : ''}`}
            style={
                {gridTemplateColumns:  `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }
            }>
            {
                Array.apply(0, Array(rows*cols)).map((x, i) => {
                    if (camIds[i] < numCameras && play_dir !== '' && play_files.includes(camIds[i]+1)){
                        return <CameraBox key={`cam -${camIds[i]}`} camId={camIds[i]} 
                            url={`${mediaURL}/videos/${play_dir}/${camIds[i]+1}.mp4`}
                            // url={'http://localhost:8000/videos/2023-06-11-16-54-52/camera-1.mp4'}
                        />;
                    }
                    else
                        return (<div key={`nocam -${camIds[i]}`} className={`nocam_cell ${fullView_camId === camIds[i] ? 'fullview' : fullView_camId !== -1 ? 'hidden' : ''}`}></div>);
                })
            }
        </div>
    )
};
export default (CameraGrid);