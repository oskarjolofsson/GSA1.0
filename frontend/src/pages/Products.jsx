import Textbox from '../components/textBox/textBox.jsx';
import PriceBox from '../components/price/pricebox.jsx';

export default function Products() {
    return (
        <div>
            <PriceBox />
            <Textbox header={"TODO"} text={"This page will show what products we offer together with a plan"} />
        </div>
    );
}