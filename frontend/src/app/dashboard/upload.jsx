//import CenteredPanel from "../components/dashboard/CenteredPanel";
import FileUpload from "../../components/fileUpload/fileUpload2.jsx";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { fileTransferService } from "../../services/fileTransferService.js";

import UploadFlow from "../../features/upload/uploadFlow.jsx";

export default function DashboardUpload() {
  const location = useLocation();
  const [uploadedFile] = useState(() => {
    return fileTransferService.getFile() || location.state?.uploadedFile;
  });

  return (
    // <div className="w-full flex items-center justify-center">
    //   <div className="w-full">
    //     <FileUpload />
    //   </div>
    // </div>

    <UploadFlow initialFile={uploadedFile} />

  );
}
