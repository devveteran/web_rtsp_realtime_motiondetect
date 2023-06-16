// import { setCapture } from "@store/reducers/global";
import "./style.css";
import { ChangeEvent, MouseEvent, memo } from 'react'
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@store/index";

interface PropType {
    width: number,
    height: number,
    video: HTMLVideoElement | null,
};

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
const Canvas = ({width, height, video}: PropType) => {
    // const capture = useSelector((state:RootState) => state.global.capture);
    const dispatch = useDispatch();
    const canvasRef = useRef<any>(null);
    const rects = useRef<Array<RectType>>([]);
    const bMouseDown = useRef<boolean>(false);
    const currentRect = useRef<RectType>(initialRect);
    const [showMenu, setShowMenu] = useState(false);

    const updateCanvas = (bDrawCurrent: boolean) => {
        const canvas = canvasRef.current;
        if (canvas !== null) {
            const context = canvas.getContext('2d');
            context.lineWidth = "2";
            context.strokeStyle = "red";
            context.font = "20px Georgia";
            context.fillStyle = '#ff0000';

            context.beginPath();
            context.clearRect(0, 0, width, height);
            context.stroke();

            if (bDrawCurrent){
                context.beginPath();
                context.rect(currentRect.current.x, currentRect.current.y, 
                    currentRect.current.width, currentRect.current.height);
                context.stroke();
            }
            if (rects.current.length > 0) {
                rects.current.forEach((rect) => {
                    context.beginPath();
                    context.rect(rect.x, rect.y, rect.width, rect.height);
                    context.stroke();

                    let txtwidth = context.measureText(rect.caption).width;
                    context.beginPath();
                    context.fillStyle = '#ffffffa0';
                    context.fillRect(rect.x+2, rect.y+2, txtwidth + 10, 25);
                    context.stroke();

                    context.fillStyle = '#ff0000';
                    context.fillText(rect.caption, rect.x+5, rect.y+20);
                });
            }

            // requestRef.current = requestAnimationFrame(updateCanvas);
            // img.onload = () => {
                // context.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
            // }
        }
    }
    
    const onMouseDown = (e: MouseEvent<HTMLElement>): void => {
        e.preventDefault();
        if (showMenu)
            return;
        bMouseDown.current = true;
        let bounds = e.currentTarget.getBoundingClientRect();
        let x = e.clientX - bounds.left;
        let y = e.clientY - bounds.top;
        currentRect.current.x = x;
        currentRect.current.y = y;
    }

    const onMouseMove = (e: MouseEvent<HTMLElement>) : void => {
        e.preventDefault();
        if (showMenu)
            return;
        if (bMouseDown.current === true) {
            let bounds = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - bounds.left;
            let y = e.clientY - bounds.top;
            let wid = x - currentRect.current.x > 0 ? x - currentRect.current.x : 0 ;
            let hei = y - currentRect.current.y > 0 ? y - currentRect.current.y : 0;
            currentRect.current.width = wid;
            currentRect.current.height = hei;
            updateCanvas(true);
        }
    }

    const onMouseUp = (e: MouseEvent<HTMLElement>) : void => {
        e.preventDefault();
        if (showMenu)
            return;
        if (bMouseDown.current === true) {
            let bounds = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - bounds.left;
            let y = e.clientY - bounds.top;
            let wid = (x - currentRect.current.x) > 0 ? (x - currentRect.current.x) : 0 ;
            let hei = (y - currentRect.current.y) > 0 ? (y - currentRect.current.y) : 0;
            if (wid > 0 && hei > 0) {
                currentRect.current.width = wid;
                currentRect.current.height = hei;
                setShowMenu(true);
            }
            
            bMouseDown.current = false;
            updateCanvas(true);
        }
    }

    const onClickCancel = () => {
        bMouseDown.current = false;
        currentRect.current = {...initialRect};
        setShowMenu(false);
        updateCanvas(false);
    }

    const onClickSave = () => {
        bMouseDown.current = false;
        rects.current = [...rects.current, currentRect.current];
        currentRect.current = {...initialRect};
        setShowMenu(false);
        updateCanvas(false);
    }

    const onChangeInput = (v: string) => {
        currentRect.current.caption = v;
    }

    return (
        <>
            <canvas className="canvas" 
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
        </>
    )
}

export default memo(Canvas)