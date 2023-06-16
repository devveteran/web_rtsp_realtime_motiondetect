import { MouseEvent, WheelEvent, useLayoutEffect, } from 'react'
import "./style.css";
import { RootState } from "@store/index";
import { useDispatch, useSelector } from "react-redux";
import { CameraInfoType, initialCameraInfo } from "@constants/types";
import { setAllPlaying, setAllRewind, setFullViewCamId, setVideoFinished } from "@store/reducers/global";
import { useCallback, useEffect, useRef, useState } from "react";
// import ReactHlsPlayer from "react-hls-player/dist";
import { faPlay, faPause, faSave, faCamera, faExpand, faPencil, faRefresh, faEraser, faRotateBack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ZOOM_SENSITIVITY = 300;

interface PropType {
    camId: number,
    url: string
}

interface RectType {
    x: number;
    y: number;
    width: number;
    height: number;
    caption: string,
};

const initialRect: RectType = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    caption: "",
};

const menuWidth = 250;
const menuHeight = 100;

type Point = {
    x: number;
    y: number;
};
const ORIGIN = Object.freeze({ x: 0, y: 0 });
function diffPoints(p1: Point, p2: Point) {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}
function addPoints(p1: Point, p2: Point) {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}
function scalePoint(p1: Point, scale: number) {
    return { x: p1.x / scale, y: p1.y / scale };
}

const CameraBox = ({camId, url}: PropType) => {
    const numCameras = useSelector((state:RootState) => state.global.numCameras);
    const cameras = useSelector((state:RootState) => state.global.cameras);
    // const capture = useSelector((state:RootState) => state.global.capture);
    const [capture, setCapture] = useState(false);
    const dispatch = useDispatch();
    const playerRef = useRef<any>(null);
    const [showControls, setShowControls] = useState<boolean>(false);
    // const [playing, setPlaying] = useState<boolean>(true);
    const fullView_camId = useSelector((state:RootState) => state.global.fullView_camId);
    const [isDrawing, setIsDraing] = useState<boolean>(false);
    const boxRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [captured, setCaptured] = useState<boolean>(false);
    const [valid, setValid] = useState<boolean>(true);
    
    // for panning
    const [scale, setScale] = useState<number>(1);
    const [offset, setOffset] = useState<Point>(ORIGIN);
    const [mousePos, setMousePos] = useState<Point>(ORIGIN);
    const [viewportTopLeft, setViewportTopLeft] = useState<Point>(ORIGIN);
    const lastMousePosRef = useRef<Point>(ORIGIN);
    const lastOffsetRef = useRef<Point>(ORIGIN);

    const all_playing = useSelector((state:RootState) => state.global.all_playing);
    const all_rewind = useSelector((state:RootState) => state.global.all_rewind);
    const videoFinished = useSelector((state:RootState) => state.global.videoFinished);

    const capturedFrame = useRef('');
/*
*/
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasImageRef = useRef<HTMLCanvasElement>(null);
    const originalCanvas = useRef<HTMLCanvasElement>(null);
    // const rects = useRef<Array<RectType>>([]);
    const [rects, setRects] = useState<Array<RectType>>([]);
    const bMouseDown = useRef<boolean>(false);
    const currentRect = useRef<RectType>(initialRect);
    const [showMenu, setShowMenu] = useState(false);

    /* for panning */
    // update last offset
    useEffect(() => {
        lastOffsetRef.current = offset;
    }, [offset]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (canvas === null)
            return;
        const context = canvas.getContext('2d');
        if (context && lastOffsetRef.current) {
          const offsetDiff = diffPoints(offset, lastOffsetRef.current);
          let tmp_topleft = diffPoints(viewportTopLeft, offsetDiff);
          setViewportTopLeft(tmp_topleft);
        }
    }, [offset, scale]);

    useLayoutEffect(() => {
        updateImageCanvas();
        updateCanvas(false);
    }, [width, height, viewportTopLeft, rects]);

    const panMouseMove = (e: MouseEvent<HTMLElement>) => {
        if (!bMouseDown.current)
            return;
        let bounds = e.currentTarget.getBoundingClientRect();
        let x = Math.round(e.clientX - bounds.left);
        let y = Math.round(e.clientY - bounds.top);
        const canvas = canvasRef.current;
        if (canvas === null)
            return;
        const context = canvas.getContext('2d');
          if (context) {
            const lastMousePos = lastMousePosRef.current;
            const currentMousePos = { x: x, y: y }; // use document so can pan off element
            lastMousePosRef.current = currentMousePos;
    
            const mouseDiff = diffPoints(currentMousePos, lastMousePos);
            setOffset((prevOffset) => addPoints(prevOffset, mouseDiff));
        }
    };
    
    const panMouseUp = () => {
        bMouseDown.current = false;
    }    

    const panMouseDown = (e: MouseEvent<HTMLElement>) => {
        bMouseDown.current = true;
        let bounds = e.currentTarget.getBoundingClientRect();
        let x = Math.round(e.clientX - bounds.left);
        let y = Math.round(e.clientY - bounds.top);
        lastMousePosRef.current = { x: x, y: y };
    };

    const updateImageCanvas = () => {
        const canvas = canvasImageRef.current;
        const canvas_original = originalCanvas.current;
        if (canvas !== null) {
            const context = canvas.getContext('2d');
            
            if (context !== null) {
                context.lineWidth = 2;
                context.strokeStyle = "red";
                context.font = "20px Georgia";
                context.fillStyle = '#ff0000';
                context.clearRect(0, 0, width, height);
                if (canvas_original !== null && canvas_original.width > 0 && canvas_original.height > 0)
                    context.drawImage(canvas_original, -viewportTopLeft.x*scale, -viewportTopLeft.y*scale, width*scale, height*scale);
            }
        }
    }

    const updateCanvas = (bDrawCurrent: boolean, invalidate: boolean = true) => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            const context = canvas.getContext('2d');
            if (context === null) {
                return;
            }

            context.lineWidth = 2;
            context.strokeStyle = "red";
            context.font = "20px Georgia";
            context.fillStyle = '#ff0000';
            
            if (invalidate === true) {
                context.beginPath();
                context.clearRect(0, 0, width, height);
                context.stroke();
            }

            if (bDrawCurrent){
                context.beginPath();
                context.rect(currentRect.current.x, currentRect.current.y, 
                    currentRect.current.width, currentRect.current.height);
                context.stroke();
            }

            if (rects.length > 0) {
                rects.forEach((rect) => {
                    context.beginPath();
                    context.rect((rect.x - viewportTopLeft.x)*scale, (rect.y-viewportTopLeft.y)*scale, rect.width*scale, rect.height*scale);
                    context.stroke();

                    let txtwidth = context.measureText(rect.caption).width;
                    context.beginPath();
                    context.fillStyle = '#ffffffa0';
                    context.fillRect((rect.x - viewportTopLeft.x)*scale, (rect.y - viewportTopLeft.y)*scale, txtwidth + 10, 25);
                    context.stroke();

                    context.fillStyle = '#ff0000';
                    context.fillText(rect.caption, (rect.x - viewportTopLeft.x)*scale, (rect.y - viewportTopLeft.y)*scale + 20);
                });
            }
        }
    }

    const isPanning = () : boolean => (!all_playing && !isDrawing && fullView_camId == camId)

    const onMouseDown = (e: MouseEvent<HTMLElement>): void => {
        // e.preventDefault();
        if (showMenu)
            return;
        bMouseDown.current = true;
        let bounds = e.currentTarget.getBoundingClientRect();
        let x = Math.round(e.clientX - bounds.left);
        let y = Math.round(e.clientY - bounds.top);
        currentRect.current.x = x;
        currentRect.current.y = y;
        currentRect.current.width = 0;
        currentRect.current.height = 0;
    }

    const onMouseMove = (e: MouseEvent<HTMLElement>) : void => {
        // e.preventDefault();
        if (showMenu)
            return;
        if (bMouseDown.current === true) {     
            let bounds = e.currentTarget.getBoundingClientRect();
            let x = Math.round(e.clientX - bounds.left);
            let y = Math.round(e.clientY - bounds.top);
            let wid = x - currentRect.current.x > 0 ? x - currentRect.current.x : 0;
            let hei = y - currentRect.current.y > 0 ? y - currentRect.current.y : 0;

            if (isDrawing) {
                currentRect.current.width = wid;
                currentRect.current.height = hei;
                updateCanvas(true);
            }
        }
    }

    
    const onMouseUp = (e: MouseEvent<HTMLElement>) : void => {
        // e.preventDefault();
        if (showMenu)
            return;
        if (bMouseDown.current === true) {
            let bounds = e.currentTarget.getBoundingClientRect();
            let x = Math.round(e.clientX - bounds.left);
            let y = Math.round(e.clientY - bounds.top);
            let wid = (x - currentRect.current.x) > 0 ? (x - currentRect.current.x) : 0 ;
            let hei = (y - currentRect.current.y) > 0 ? (y - currentRect.current.y) : 0;
            if (isDrawing) {
                if (wid > 0 && hei > 0) {
                    currentRect.current.width = wid;
                    currentRect.current.height = hei;
                    setShowMenu(true);
                }
                updateCanvas(true);
            }
            bMouseDown.current = false;
        }
    }

    const handleWheel = (e: WheelEvent<HTMLDivElement>): void => {
        
        if (isPanning() || (isDrawing && !showMenu)) {
            let bounds = e.currentTarget.getBoundingClientRect();
            let x = Math.round(e.clientX - bounds.left);
            let y = Math.round(e.clientY - bounds.top);
            const zoom = 1 - e.deltaY / ZOOM_SENSITIVITY;
            
            const canvasImg = canvasImageRef.current;
            const canvasDraw = canvasRef.current;
            if (canvasImg !== null) {
                let newscale = scale * zoom;
                if (newscale < 1)
                    newscale = 1;
                setScale(newscale);
            }
        }
    };

    const onClickCancel = () => {
        bMouseDown.current = false;
        currentRect.current = {...initialRect};
        setShowMenu(false);
        updateCanvas(false);
    }

    const onClickSave = () => {
        bMouseDown.current = false;
        // rects.current = [...rects.current, currentRect.current];
        currentRect.current.x = currentRect.current.x / scale +  viewportTopLeft.x ;
        currentRect.current.y = currentRect.current.y / scale + viewportTopLeft.y;
        currentRect.current.width = currentRect.current.width / scale;
        currentRect.current.height = currentRect.current.height / scale;
        setRects([...rects, currentRect.current]);
        currentRect.current = {...initialRect};
        setShowMenu(false);
    }

    const onChangeInput = (v: string) => {
        currentRect.current.caption = v;
    }
/*
*/
    const togglePlay = (e: MouseEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (playerRef.current === null)
            return;
        setCaptured(false);
        if (all_playing === true) {
            // setPlaying(false);
            dispatch(setAllPlaying(false));
            // playerRef.current.pause();
        } else {
            // setPlaying(true);
            dispatch(setAllPlaying(true));
            // playerRef.current.play();
        }
    }

    const onLoadVideo = () => {
        if (playerRef.current === null)
            return;
        if( playerRef.current.readyState >= 2)
            playerRef.current.play();
        else{
            setTimeout(() => {
                if( playerRef.current.readyState >= 2)
                    playerRef.current.play();
            }, 500);
        }
        // setPlaying(true);
        dispatch(setAllPlaying(true));
        // setVideoFinished(false);
        dispatch(setVideoFinished({...videoFinished, [camId]:false}));
    }

    useEffect(() => {
        if (playerRef.current === null)
            return;
        playerRef.current.currentTime = 0;
        dispatch(setAllPlaying(true));
        dispatch(setVideoFinished({...videoFinished, [camId]:false}));
        if( playerRef.current.readyState >= 2)
            playerRef.current.play();
        else {
            setTimeout(() => {
                if( playerRef.current.readyState >= 2)
                    playerRef.current.play();
            }, 500);
        }
    }, [all_rewind]);

    const onEndedVideo = () => {
        dispatch(setVideoFinished({...videoFinished, [camId]:true}));
    }

    const toggle_FullView = () => {
        if (isDrawing)
            return;
        setRects([]);
        if (fullView_camId === -1)
            dispatch(setFullViewCamId(camId));
        else
            dispatch(setFullViewCamId(-1));
    };

    const toggle_Drawing = () => {
        setIsDraing(!isDrawing);
        setShowMenu(false);
    }
    const clearAnnotations = () => {
        setRects([]);
    }

    useEffect(() => {
        if (url !== "") {
            var request = new XMLHttpRequest();
            request.open('GET', url);
            request.responseType = 'blob';

            request.onload = () => {
                var reader = new FileReader();
                reader.readAsDataURL(request.response);
                reader.onload = (e: any) => {
                    playerRef.current.src = e.target.result;
                    playerRef.current.currentTime = 0;
                    dispatch(setAllPlaying(true));
                    // setVideoFinished(false);
                    dispatch(setVideoFinished({...videoFinished, [camId]:false}));
                }
            }
            request.send();
        }
    }, [url]);

    const resetCanvas = () => {
        setScale(1);
        lastMousePosRef.current = ORIGIN;
        lastOffsetRef.current = ORIGIN;
        setOffset(ORIGIN);
        setViewportTopLeft(ORIGIN);

        const canvas = canvasImageRef.current;
        const original_canvas = originalCanvas.current;
        if (canvas !== null && original_canvas !== null) {
            const context = canvas.getContext('2d');
            const context_bak = original_canvas.getContext('2d');
            if (context !== null && original_canvas.width > 0 && original_canvas.height > 0){
                // context_bak.clearRect(0, 0, width, height);
                context.drawImage(original_canvas, 0, 0);
            }
        }
    }

    useLayoutEffect(() => {
        if (boxRef.current !== null) {
            if (boxRef.current.clientHeight > 0 && 
                boxRef.current.clientWidth > 0 && 
                boxRef.current.clientWidth !== width && 
                height !== boxRef.current.clientHeight) 
            {
                setWidth(boxRef.current.clientWidth);
                setHeight(boxRef.current.clientHeight);
                resetCanvas();
            }
        }
    });

    const onCapture = useCallback(() => {
        setCapture(true);
    }, []);

    useEffect(() => {
        if (capture === true) {
            setCapture(false);
            let video = playerRef.current;
            if (capture === true && video !== null) {
                const canvas = canvasImageRef.current;
                const canvas_original = originalCanvas.current;
                if (canvas !== null) {
                    if (all_playing === true) {
                        const context = canvas.getContext('2d');
                        if (context !== null && video.readyState >= 2){
                            context.drawImage( video, 0, 0, width, height );
                        }
                        let image = canvas.toDataURL('image/jpeg');
                            downloadImage(image);
                    } else {
                        if (canvas_original !== null) {
                            let image = canvas_original.toDataURL('image/jpeg');
                            downloadImage(image);
                        }
                    }
                }
            }
        }
    }, [capture]);

    useEffect(() => {
        if (all_playing === false) { // && captured === false
            let video = playerRef.current;
            if (video !== null) {
                const canvas = canvasImageRef.current;
                const original_canvas = originalCanvas.current;
                if (canvas !== null && original_canvas !== null) {
                    const context = canvas.getContext('2d');
                    const context_bak = original_canvas.getContext('2d');
                    if (context !== null && context_bak !== null && video.readyState >= 2){
                        context.drawImage( video, 0, 0, width, height );
                        context_bak.drawImage( video, 0, 0, width, height );
                        capturedFrame.current = canvas.toDataURL('image/jpeg');
                    }
                }
                setCaptured(true);
            }
        } else {
            resetCanvas();
        }
        // setCanvasOffset({offx:0, offy:0});
    }, [all_playing, width, height]);

    useEffect(() => {
        let video = playerRef.current;
        if (video === null)
            return;
        if (all_playing === true) { // && captured === false
            if (video.paused) {
                if (video.readyState >= 2)
                    video.play();
                else {
                    setTimeout(() => {
                        if( playerRef.current.readyState >= 2)
                            video.play();
                    }, 500);
                }
            }                
        } else {
            if (!video.paused){
                if (video.readyState >= 2)
                    video.pause();
                else {
                    setTimeout(() => {
                        if( playerRef.current.readyState >= 2)
                            video.pause();
                    }, 500);                    
                }
            }
        }
    }, [all_playing]);

    const downloadImage = (image: any) => {
        let a_obj = document.getElementById('tmp_link');
        if (a_obj == null) {
            const element = document.createElement("a");
            element.id = "tmp_link"
            const trimmedString = image.replace('data:image/jpeg;base64,', '');
            const imageContent = atob(trimmedString);
            const buffer = new ArrayBuffer(imageContent.length);
            const view = new Uint8Array(buffer);
            for (let n = 0; n < imageContent.length; n++) {
                view[n] = imageContent.charCodeAt(n);
            }
            const type = 'image/jpeg';
            const blob = new Blob([buffer], { type });
            element.href = URL.createObjectURL(blob);
            element.download = `image_camera_${camId}.jpg`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
        let str_anno = "";
        rects.forEach((e) => {
            str_anno = str_anno + e.caption + " " + e.x + " " + e.y + " " + e.width + " " + e.height + "\n";
        });
        let b_obj = document.getElementById('tmp_link2');
        if (b_obj == null) {
            const element = document.createElement("a");
            element.id = "tmp_link2"
            const file = new Blob([str_anno], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = `image_camera_${camId}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    }

    return (
        valid === true ? (
        <>
            <div id={`camera-${camId}-view`}
                ref={boxRef}
                className={`camera-box ${fullView_camId === camId ? 'fullview' : fullView_camId !== -1 ? 'hidden' : ''} ${isDrawing ? 'drawing' : ''}`}
                onMouseOver={() => setShowControls(true)} 
                onMouseLeave={() => setShowControls(false)}
                onWheel={handleWheel}
                onMouseDown={isPanning() ? panMouseDown: onMouseDown}
                onMouseUp={isPanning() ? panMouseUp : onMouseUp} 
                onMouseMove={isPanning() ? panMouseMove : onMouseMove}
                >
                {
                    <>
                        <div className="camera-controls-wrapper" style={{zIndex:4, opacity: showControls ? 1 : 0}} >
                            {/* <FontAwesomeIcon 
                                className="button-icon back-red" 
                                icon={all_playing ? faPause: videoFinished ? faRefresh: faPlay} 
                                color="#ffffff" 
                                onClick={all_playing ? togglePlay : videoFinished ? onRewind : togglePlay}/> */}
                        </div>
                        <div className="camera-buttons-wrapper" style={{zIndex: 4, opacity: showControls ? 1 : 0}}>
                            <FontAwesomeIcon icon={faPencil} color={isDrawing ? '#ff0000' : '#0000ff'} 
                                className="button-icon button-draw" onClick={() => toggle_Drawing()}
                                title='Add Annotation'/>
                            <FontAwesomeIcon icon={faEraser} color={'#0000ff'} 
                                className="button-icon button-draw" onClick={() => clearAnnotations()}
                                title='Clear Annotations'/>
                            <FontAwesomeIcon icon={faRotateBack} color={'#0000ff'} 
                                className={`button-icon button-draw ${fullView_camId === camId ? '' : 'hidden'}`} onClick={resetCanvas}
                                title='Reset Zoom'/>
                            <FontAwesomeIcon icon={faSave} color='#0000ff' className="button-icon" onClick={() => onCapture()}
                                title='Save Annotations'/>
                            <FontAwesomeIcon icon={faExpand} color='#0000ff' className="button-icon" onClick={() => toggle_FullView()}
                                title='Toggle Display Mode'/>
                        </div>
                    </>
                }
                {
                    (camId >= 0 && camId < numCameras) ? (
                        <div className="cambox" onDoubleClick={() => toggle_FullView()}>
                            <video
                                // onReady={onLoadVideo}
                                // onLoad={onLoadVideo}
                                ref={playerRef}
                                // playing={playing}
                                autoPlay={true} 
                                className="video"
                                style={
                                    {
                                        objectFit: 'fill',
                                        visibility: `${(isDrawing && fullView_camId == camId && !all_playing) || isPanning() ? 'hidden': 'visible'}`
                                    }
                                }
                                controls={false}
                                muted={true}
                                width="100%"
                                height="100%"
                                onEnded={onEndedVideo}
                                // url={url}
                                // src={url}
                            />
                                {/* <source src={url} type="video/mp4"/>
                            </video> */}
                            {/* <ReactHlsPlayer
                                className="video"
                                playerRef={playerRef}
                                src={url}
                                autoPlay={true}
                                controls={false}
                                muted={true}
                                width="100%"
                                height="100%"
                                style={{objectFit:'fill'}} /> */}
                            <div className="channel-title-wrapper">
                                <span className="channel-title">CHANNEL {camId + 1}</span>
                            </div>
                            {
                                (capture === true || all_playing === false) ? (
                                    <>
                                        <canvas className={`canvas ${isDrawing ? '' : isPanning() ? 'hand_cursor' : ''}`}
                                            id="test-canvas"
                                            ref={canvasImageRef} 
                                            width={width} height={height}
                                            style={
                                                {
                                                    width:width, 
                                                    height:height,
                                                    // transform:`scale(${scale}, ${scale}) translate(${canvasOffset.offx}px, ${canvasOffset.offy}px)` 
                                                }
                                            }
                                        />
                                        <canvas className={`canvas hidden`}
                                            id="original-canvas"
                                            ref={originalCanvas} 
                                            width={width} height={height}
                                            style={
                                                {
                                                    width:width, 
                                                    height:height,
                                                }
                                            }
                                        />
                                    </>
                                ) : null
                            }
                            <canvas className={`canvas ${isPanning() || !isDrawing ? 'hand_cursor' : ''}`} 
                                ref={canvasRef} 
                                onMouseDown={onMouseDown}
                                onMouseUp={onMouseUp} 
                                onMouseMove={onMouseMove}
                                width={width} height={height}
                                style={{width:width, height:height}}/>
                            {
                                showMenu === true && (
                                    <div className={`canvas-menu`} 
                                        style={{width: `${menuWidth}px`, 
                                                height:`${menuHeight}px`, 
                                                left: `${currentRect.current.x + currentRect.current.width + 10 + menuWidth < width ? currentRect.current.x + currentRect.current.width + 10: width - menuWidth}px`,
                                                top: `${currentRect.current.y + currentRect.current.height - menuHeight > 0 ? currentRect.current.y + currentRect.current.height - menuHeight: 0}px`}}>
                                        <input type='text' className="menu-input" onChange={e => onChangeInput(e.target.value)}/>
                                        <div className="menu-button-wrapper">
                                            <input type='button' className="btn-menu button-cancel" onClick={onClickCancel} value="CANCEL"/>
                                            <input type='button' className="btn-menu button-save" onClick={onClickSave} value="SAVE"/>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    ) :
                        null
                }
            </div>
        </>
        ) : (
            <div id={`camera-${camId}-view`} 
            className={`camera-box ${fullView_camId === camId ? 'fullview' : fullView_camId !== -1 ? 'hidden' : ''} ${isDrawing ? 'drawing' : ''}`}></div>
        )
    )
}
export default (CameraBox);