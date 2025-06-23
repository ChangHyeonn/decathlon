# yolo detector --main

from ultralytics import YOLO
import torch

class YOLODetector:
    def __init__(self):
        self.model = YOLO("models/best.pt")

    def detect(self, frame):
        results = self.model.predict(
            frame, 
            imgsz=1280, 
            conf=0.4, 
            stream=True, 
            device='cuda' if torch.cuda.is_available() else 'cpu')
        detections = []
        
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                if cls == 0:
                    detections.append((x1, y1, x2, y2, conf, cls))
                else:
                    continue
        return detections