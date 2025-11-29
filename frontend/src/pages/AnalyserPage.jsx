import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import FileUpload from "../components/fileUpload/fileUpload2.jsx";
import { fileTransferService } from "../services/fileTransferService.js";

export default function AnalyserPage() {
    const location = useLocation();
    const [uploadedFile] = useState(() => {
        return fileTransferService.getFile() || location.state?.uploadedFile;
    });

    return (
        <div>
            <FileUpload initialFile={uploadedFile} />
        </div>
    );
}