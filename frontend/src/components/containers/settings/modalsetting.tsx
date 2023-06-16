import { useEffect, useState } from 'react';
import './styles.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import InputCell from '@atoms/inputcell/inputcell';
import { setCameras, setNumCameras } from '@store/reducers/global';
import { CameraInfoType, initialCameraInfo } from '@constants/types';

interface PropType {
    setModal: (b: boolean) => void,
}

const ModalSetting = ({setModal} : PropType) => {
    const numCameras = useSelector((state:RootState) => state.global.numCameras);
    const cameras = useSelector((state:RootState) => state.global.cameras);
    const triggers = useSelector((state:RootState) => state.global.triggers);
    const [cams, setCams] = useState<Array<CameraInfoType>>(cameras);
    const [numcams, setNumCams] = useState<number>(numCameras);

    const dispatch = useDispatch();
    
    const onChangeNumCam = (v: string) => {
        let n = Number(v);
        if (isNaN(n)){
            n = 10;
        }else {
            if (n === 0)
                n = 1;
            else if (n > 10)
                n = 10;
        }
        // dispatch(setNumCameras(n));
        setNumCams(n);
    }
    
    const onUpdateRTSP = (v: string, i: number) => {
        const tmp_cams = [...cams];
        tmp_cams[i] = {...tmp_cams[i], rtsp:v}
        // dispatch(setCameras(cams));
        setCams(tmp_cams);
    }

    useEffect(() => {
        const ary = [];
        
        for (let i = 0; i<numcams; i++) {
            if (i < cams.length)
                ary.push(cams[i])
            else {
                ary.push(initialCameraInfo);
            }
        }
        // dispatch(setCameras(ary));
        setCams(ary);
    }, [numcams]);

    return (
        <div className='modal-back'>
            <div className='modal'>
                <div>
                    <InputCell title={'Number of Cameras'} value={numcams.toString()} onChange={(v: string) => onChangeNumCam(v)}/>
                    {
                        cams.map((cam, i) => {
                            return <InputCell title={`URL of Cam-${i+1}`} value={cam.rtsp} onChange={(v: string) => onUpdateRTSP(v, i)}/>
                        })
                    }
                    <div className='button-wrapper'>
                        <input type='button' className='button' value='Cancel' onClick={() => setModal(false)}/>
                        <input type='button' className='button' value='Save' />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ModalSetting;