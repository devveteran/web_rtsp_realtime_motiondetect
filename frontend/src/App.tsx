import CameraGrid from '@containers/cameragrid';
import './App.css';
import RecordList from '@containers/recordlist';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import { serverURL } from '@services/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faPause, faPlay, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { setAllPlaying, setAllRewind, setVideoFinished } from '@store/reducers/global';
import ModalSetting from '@containers/settings/modalsetting';

function App() {
  const timerId = useRef<any>(null);
  const [dirs, setDirs] = useState<Array<string>>([]);
  const [recording, setRecording] = useState<boolean>(false);
  const all_playing = useSelector((state:RootState) => state.global.all_playing);
  const all_rewind = useSelector((state:RootState) => state.global.all_rewind);
  const dispatch = useDispatch();
  const videoFinished = useSelector((state:RootState) => state.global.videoFinished);
  const play_files = useSelector((state:RootState) => state.global.play_files);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const grabDirectories = () => {
    fetch(`${serverURL}`, 
    {
        method:'GET',
        headers: new Headers({'content-type': 'application/json'}),
        mode:'cors'
    })
    .then(response => response.json())
    .then((data) => {
      // console.log(data.list);
      setDirs(data?.list);
    })
    .catch(error => {
        console.log(error);
    });
  }
  const updateState = () => {
    fetch(`${serverURL}/update`, 
    {
        method:'GET',
        headers: new Headers({'content-type': 'application/json'}),
        mode:'cors'
    })
    .then(response => response.json())
    .then((data) => {
      let status = data?.status;
      if(status === 'recording') {
        setRecording(true);
      } else if (status === 'recorded'){
        let dir = data?.dir;
        setRecording(false);
        setDirs(prev => ([...prev, dir]));
      }
    })
    .catch(error => {
        console.log(error);
    });
  }
  useEffect(() => {
    grabDirectories();
    setTimeout(() => {
      if (timerId.current === null) {
        timerId.current = setInterval(() => updateState(), 1000);
      }      
    }, 500);
  }, []);

  useEffect(() => {
    let b = getAllFinished();
    if (b) {
      dispatch(setVideoFinished([]));
      dispatch(setAllPlaying(false));
    }
  }, [videoFinished]);

  const togglePlay = (e: MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (all_playing === true) {
        dispatch(setAllPlaying(false));
    } else {
        dispatch(setAllPlaying(true));
    }
  }

  const getAllFinished = () => {
    if (play_files.length == 0)
      return false;
    let aryids :Array<string>= [];
    Object.keys(videoFinished).forEach((e, i) => {
      let val = Object.values(videoFinished).at(i);
      aryids.push(e);
      if(val === undefined|| val === false){
        return false;
      }
    });
    if (aryids.length < play_files.length)
      return false;
    else
      return true;
  }

  const onRewind = () => {
    dispatch(setAllRewind(!all_rewind));
  }

  const onSettings = () => {
    if (!showSettings)
      setShowSettings(true);
  }

  return (
    <div className={`body main-view`}>
        <div className="section-cameras">
          {/* {
            fullView_camId !== -1 ?
              <CameraGrid rows={1} cols={1} camIds={[fullView_camId]} fullView={true}/> :
              <CameraGrid rows={1} cols={1} camIds={[fullView_camId]} fullView={true}/>
          } */}
          <CameraGrid rows={1} cols={2} camIds={[0, 1]} />
          <CameraGrid rows={2} cols={4} camIds={[2, 3, 4, 5, 6, 7, 8, 9]}/>
          
        </div>
          
        <div className="section-faces">
          <RecordList status={recording} dirs={dirs} />
          <div className="button-div">
            <FontAwesomeIcon 
              className="button-icon back-red" 
              icon={all_playing ? faPause: faPlay} 
              color="#ffffff" 
              onClick={togglePlay}
            />
            <FontAwesomeIcon 
              className="button-icon back-red" 
              icon={faRefresh} 
              color="#ffffff" 
              onClick={onRewind}
            />
            <FontAwesomeIcon
              className='button-icon back-red'
              icon={faGear}
              color='#ffffff'
              style={{display:'none'}}
              onClick={onSettings}
            />
          </div>          
        </div>
        {
          showSettings === true && (
            <ModalSetting setModal={setShowSettings}/>
          )
        }
      </div>
  );
}

export default App;
