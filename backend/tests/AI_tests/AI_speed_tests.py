import sys
import os
import io
import time

# Add the backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app import app  # import your Flask app

def test_video_upload():
    # Use the actual test video file
    test_video_path = os.path.join(os.path.dirname(__file__), "test_video.mp4")
    
    with open(test_video_path, "rb") as video_file:
        data = {
            "video": (video_file, "test_video.mp4"),
            "note": "This is a test note.",
            "start_time": "0",
            "end_time": "2",
            "user_id": "8oAXCb0Th2OohAOy96kFT3zMeCC2"
        }
        
        t1 = time.time()
        with app.test_client() as client:
            response = client.post(
                "/api/v1/analysis/upload_video",
                data=data,
                content_type="multipart/form-data",
            )
        t2 = time.time()
        total = t2 - t1
        print(f"Video upload and analysis took {total} seconds")
        
        # Write total time in "../notes.txt"
        with open("backend/tests/AI_tests/notes.txt", "a") as f:
            f.write(f"Video upload and analysis took {total} seconds\n")

        assert response.status_code == 200
        assert total < 120  # Ensure the operation takes less than 120 seconds
        json_data = response.get_json()
        assert "analysis_results" in json_data