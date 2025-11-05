import { useLocation } from 'react-router-dom';
import FileUpload from "../components/fileUpload/fileUpload2.jsx";

export default function AnalyserPage() {
    const location = useLocation();
    const uploadedFile = location.state?.uploadedFile;

    return (
        <div>
            <FileUpload initialFile={uploadedFile} />
        </div>
    );
}