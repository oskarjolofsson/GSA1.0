from Quality import Quality
from typing import Any
import cv2
from services.file_handeling.Image_file import Image_file

class ImageQuality(Quality):
    def __init__(self, file: Image_file):
        super().__init__(file)

    def validate(self) -> bool:
        return self.is_not_blurry() and self.correct_size()

    def issues(self) -> list[str]:
        return_list: list[str] = []
        # Dictionary for methods to test and error messages if not true
        checks = {
            self.correct_size: "Image is too small",
            self.is_not_blurry: "Image is blurry"
        }

        for check, message in checks.items():
            if not check():
                return_list.append(message)

        return return_list
        

    # Makes sure the image is not to blurry
    def is_not_blurry(self, threshold: int = 100.0) -> bool:
        image = cv2.imread(self.file.path())
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # False if blurry
        return laplacian_var > threshold  

    def correct_size(self, min_width: int = 512, min_height: int = 512) -> bool:
        m = self.file.metrics()
        return m["width"] >= min_width and m["height"] >= min_height

        
    # Add more methods to test aspects bellow
    # Also add these mehtods in self.issues dict as well self.validate 

# TODO Make machine learning model for calculating if correct sport, seperate class of course
    
