import './styles.css';
interface PropType {
    title: string,
    value: string,
    onChange: (v: string) => void,
}
const InputCell = ({title, value, onChange}: PropType) => {
    return (
        <div className='cell'>
            <label className='cell-title'>{title}</label>
            <input className='cell-value' type='text' value={value} onChange={(e) => onChange(e.currentTarget.value)}/>
        </div>
    )
};
export default InputCell;