#!/usr/bin/env python3
"""
Test script for video processing functionality

This script demonstrates how to use the VideoProcessingService
to extract metadata and keyframes from a video file.
"""

import os
from services.video_service import VideoProcessingService

def test_video_processing():
    """
    Test the video processing functionality
    """
    print("🎥 Testing Video Processing Service")
    print("=" * 50)
    
    # Initialize the service
    upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
    video_service = VideoProcessingService(upload_folder)

    # Create the uploads directory if it doesn't exist
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
        print(f"Created upload folder: {upload_folder}")
    else:
        print(f"Using existing upload folder: {upload_folder}")
    
   
    video_file_name = "20250626_191212.mp4" 
    video_path = os.path.join(upload_folder, video_file_name)
    # Check that video_path exists
    if not os.path.exists(video_path):
        print(f"Video file not found: {video_path}")
        return
    print(f"Using video file: {video_path}")

    # Process the video    
    if os.path.exists(video_path):
        print(f"Processing video: {os.path.basename(video_path)}")
        metadata = video_service.create_video_metadata(video_path, 10)
        
        print("\n📊 Extracted Metadata:")
        print(f"  • Filename: {metadata['filename']}")
        print(f"  • Duration: {metadata['duration']} seconds")
        print(f"  • Resolution: {metadata['resolution']}")
        print(f"  • FPS: {metadata['fps']}")
        print(f"  • File Size: {metadata['file_size']} bytes")
        print(f"  • Keyframes Extracted: {metadata['num_keyframes_extracted']}")
        
        print("\n🖼️ Keyframe Paths:")
        for i, keyframe_path in enumerate(metadata['keyframes']):
            print(f"  {i+1}. {keyframe_path}")
            
        print("\n✅ Video processing completed successfully!")
    else:
        print(f"❌ Video file not found: {video_path}")
        print("Please add a video file to test.")
    

if __name__ == "__main__":
    test_video_processing()
