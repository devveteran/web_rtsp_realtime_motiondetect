import { useEffect, useRef } from "react";
import "./style.css";
import RecordItem from "@organisms/recorditem";

interface PropType {
    status: boolean,
    dirs: Array<string> | []
}

const RecordList = ({status, dirs}: PropType) => {
    const ref = useRef<HTMLDivElement>(null);

    const scrollToLast = () => {
        const lastele = ref.current?.lastElementChild;
        lastele?.scrollIntoView({behavior: 'smooth'});
    }
    useEffect(() => {
        scrollToLast();
    }, [dirs]);
    
    return (
        <div ref={ref} className="record-list">
            {
                dirs.map((ele, i) => {
                    return <RecordItem key={ele} dir={ele}/>
                })
            }
            {
                status === true ? (
                    <span className="recording-note">Recording...</span>
                ) : null
            }
        </div>
    )
}
export default RecordList;