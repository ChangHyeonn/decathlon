import os
import time
import cv2
import numpy as np
from multiprocessing import Process, Queue, set_start_method, Manager
from utils.yolo_detector import YOLODetector
from utils.deepsort_tracker import DeepSortTracker
from utils.reid_torch import TorchReIDFeatureExtractor
from utils.data_analysis import DataAnalyzer
import config


def point_in_poly(point, poly):
    x, y = point
    inside = False
    n = len(poly)
    p1x, p1y = poly[0]
    for i in range(n+1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def reid_process(task_queue, result_queue):
    reid = TorchReIDFeatureExtractor()
    while True:
        item = task_queue.get()
        if item is None:
            break
        cam_name, feat, track_id = item
        global_id = reid.register_or_match_feature(feat, cam_name)
        result_queue.put((cam_name, track_id, global_id))


def process_camera(cam_name, task_queue, result_queue, shared_data):
    detector = YOLODetector()
    tracker = DeepSortTracker()
    reid_extractor = TorchReIDFeatureExtractor()
    video_path = config.VIDEO_PATHS[cam_name]
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"[{cam_name}] Failed to open video : {video_path}")
        return

    print(f"[{cam_name}] Started video stream")

    zones = config.CAM_ZONES.get(cam_name, {})

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        video_time_sec = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

        detections = detector.detect(frame)
        tracks = tracker.update(detections, frame)

        for track in tracks:
            if not track.is_confirmed():
                continue

            l, t, r, b = map(int, track.to_ltrb())
            cx = int((l + r) / 2)
            cy = int((t + b) / 2)

            current_zone = None
            for zone_name, points in zones.items():
                if point_in_poly((cx, cy), points):
                    current_zone = zone_name
                    break

            if not current_zone:
                continue

            crop = frame[t:b, l:r]
            if crop.size == 0:
                continue

            feat = reid_extractor.extract(crop)
            task_queue.put((cam_name, feat, track.track_id))

            key = (cam_name, track.track_id)
            info = shared_data.get(key, {
                "path": [],
                "last_zone": None,
                "last_seen": 0,
                "last_seen_second": int(video_time_sec)
            })

            if current_zone != info["last_zone"]:
                info["path"].append(current_zone)
                info["last_seen"] = 0
                info["last_seen_second"] = int(video_time_sec)

            # 영상 시간 기준으로 last_seen 증가
            current_sec = int(video_time_sec)
            if current_sec > info["last_seen_second"]:
                info["last_seen"] += current_sec - info["last_seen_second"]
                info["last_seen_second"] = current_sec

            info["last_zone"] = current_zone
            shared_data[key] = info


        time.sleep(0.01)
        while not result_queue.empty():
            cam, tid, gid = result_queue.get()

    cap.release()
    print(f"[{cam_name}] Video processing ended")

def main():
    set_start_method("spawn")
    manager = Manager()
    shared_data = manager.dict()
    task_queue = Queue(maxsize=100)
    result_queue = Queue(maxsize=100)

    reid_p = Process(target=reid_process, args=(task_queue, result_queue))
    reid_p.start()

    cam_processes = []
    for cam_name in config.VIDEO_NAMES:
        p = Process(target=process_camera, args=(cam_name, task_queue, result_queue, shared_data))
        p.start()
        cam_processes.append(p)

    for p in cam_processes:
        p.join()

    task_queue.put(None)
    reid_p.join()

    analyzer = DataAnalyzer(shared_data)
    analyzer.send_to_api()

if __name__ == "__main__":
    main()
    
# -----확정------