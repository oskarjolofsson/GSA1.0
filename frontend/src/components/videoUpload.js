import '../styles/VideoUpload.css';

export default function VideoUpload() {
    return (    
        <div className='upload-container'>
            <h2>Upload Your Swing</h2>
            <input type='file' accept='video/*' />
            <p className='description'>
                This AI-powered tool analyzes your golf swing and provides with analysis and drills.
            </p>
        </div>
    );
}