from PIL import Image
import cv2
from ultralytics import YOLO
from ultralytics.nn.tasks import PoseModel
from ultralytics.nn.modules.conv import Conv
from ultralytics.nn.modules.block import C2f, SPPF
from torch.nn import Sequential
from torch.serialization import safe_globals
import torch
import numpy as np
import os

class quality_checker:

    def __init__(self):
        # torch.serialization.add_safe_globals([PoseModel, Sequential, Conv, C2f, SPPF])
        # model_path = "backend/models/yolov8n-pose.pt"
        # with safe_globals([PoseModel, Sequential]):
        #     self.model = self.load_yolo_model(model_path)
        self.image_paths = []

    
    def paths(self):
        return self.image_paths


    def load_yolo_model(self, model_path: str):
        if not os.path.exists(model_path):
            print(f"[INFO] {model_path} not found — attempting to download automatically.")
        return YOLO(model_path)


    def add_image_paths(self, image_paths: list[str]) -> None:
        for image_path in image_paths:
            if not isinstance(image_path, str):
                print(f"Invalid path: {image_path}. It should be a string.")
                continue

            try:
                self.add_single_image_path(image_path)
            except (ValueError, FileNotFoundError) as e:
                print(f"Error adding image {image_path}: {e}")


    def add_single_image_path(self, image_path: str) -> None:
        # Check for correct file type
        if not image_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            raise ValueError(f"Invalid file type for file {image_path}")

        # Check if file exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"File does not exist: {image_path}")
        if self.is_image_acceptable(image_path):
            self.image_paths.append(image_path)
        else:
            raise ValueError(f"Image is not acceptable: {image_path}")


    def is_image_acceptable(self, image_path: str) -> bool:
        return (
            self.is_resolution_sufficient(image_path) and
            not self.is_blurry(image_path)
            #self.is_full_body_visible(image_path)
        )


    # Makes sure the width and height are large enough
    def is_resolution_sufficient(self, image_path: str, min_width: int = 512, min_height: int = 512) -> bool:
        with Image.open(image_path) as img:
            width,height = img.size
        return width >= min_width and height >= min_height
    

    # Makes sure the image is not to blurry
    def is_blurry(self, image_path: str, threshold: int = 100.0) -> bool:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # True if blurry
        return laplacian_var < threshold  
    

    def is_full_body_visible(self, image_path: str, visibility_threshold: float = 0.5) -> bool:
        results = self.model(image_path)

        # No detections?
        if not results or len(results[0].keypoints) == 0:
            return False

        keypoints = results[0].keypoints
        # Use the first person detected
        kp = keypoints.data[0].cpu().numpy()  # shape: (17, 3) → x, y, confidence

        # Define essential body parts to check (e.g. shoulders, knees, feet)
        key_indices = [5, 6, 11, 12, 15, 16]  # L/R shoulder, L/R knee, L/R foot
        visible_points = [kp[i][2] > visibility_threshold for i in key_indices]

        return all(visible_points)
    

    
    