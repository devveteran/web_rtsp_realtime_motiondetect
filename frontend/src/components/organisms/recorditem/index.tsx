import { useDispatch, useSelector } from "react-redux";
import "./style.css";
import { setPlayDir, setPlayFiles } from "@store/reducers/global";
import { RootState } from "@store/index";
import { serverURL } from "@services/server";
import { userInstance } from "@services/axios";

interface PropType {
    dir: string,
}
const RecordItem = ({dir}: PropType) => {
    const play_dir = useSelector((state:RootState) => state.global.play_dir);
    const dispatch = useDispatch();
    
    const onSelectDir = () => {
        // const payload = {
        //     dir: dir
        // };
        // userInstance().get('/files?').then(response => {

        // });

        fetch(`${serverURL}/files?dir=${dir}`, 
        {
            method:'GET',
            headers: new Headers({'content-type': 'application/json'}),
        })
        .then(response => response.json())
        .then((data) => {
          let status = data?.status;
          if(status === 'success') {
            let indexes:Array<string> = data?.files;
            let newArr: Array<number> = [];
            indexes.forEach((ele, i) => {
                newArr.push(Number(ele));
            });
            dispatch(setPlayFiles(newArr));
            dispatch(setPlayDir(dir));
          }
        })
        .catch(error => {
            console.log(error);
        });        
    }

    return (
        <div className="recorditem" onClick={onSelectDir}>
            <span className={`dir-title ${dir===play_dir ? 'selected': ''}`} >{dir}</span>
        </div>
    )
}
export default RecordItem;