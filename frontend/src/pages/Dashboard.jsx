//import CenteredPanel from "../components/dashboard/CenteredPanel";
import FileUpload from "../components/fileUpload/fileUpload2";

export default function Dashboard() {
  return (
    <div className="w-full max-w-md h-[70vh] flex items-center justify-center">
      <div className="w-full scale-90">
        <FileUpload />
      </div>
    </div>
    
  );
}
