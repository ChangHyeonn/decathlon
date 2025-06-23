import os
import time
import cv2
import numpy as np
from utils.yolo_detector import YOLODetector
from utils.deepsort_tracker import DeepSortTracker
from utils.reid_torch import FeatureExtractor
from utils.data_analysis import DataAnalyzer
from utils.global_id_matcher import GlobalIDMatcher
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

def main():
    caps = {}
    trackers = {}
    detectors = {}
    extractors = {}

    shared_data = dict()
    matcher = GlobalIDMatcher()

    # 카메라 초기화
    for cam_name in config.VIDEO_NAMES:
        caps[cam_name] = cv2.VideoCapture(config.VIDEO_PATHS[cam_name])
        trackers[cam_name] = DeepSortTracker()
        detectors[cam_name] = YOLODetector()
        extractors[cam_name] = FeatureExtractor()

    while True:
        for cam_name in config.VIDEO_NAMES:
            cap = caps[cam_name]
            ret, frame = cap.read()
            if not ret:
                continue

            video_time_sec = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            detections = detectors[cam_name].detect(frame)
            tracks = trackers[cam_name].update(detections, frame)

            zones = config.CAM_ZONES.get(cam_name, {})

            for track in tracks:
                if not track.is_confirmed():
                    continue

                l, t, r, b = map(int, track.to_ltrb())
                cx = int((l + r) / 2)
                cy = int((t + b) / 2)

                # zone 판단
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

                feat = extractors[cam_name].extract(crop)
                global_id = matcher.register_or_match_feature(feat, cam_name, track.track_id)

                key = (cam_name, track.track_id)
                info = shared_data.get(key, {
                    "path": [],
                    "last_zone": None,
                    "last_seen": 0,
                    "last_seen_second": int(video_time_sec)
                })

                if current_zone != info["last_zone"]:
                    info["path"].append(current_zone)
                    info["last_zone"] = current_zone
                    info["last_seen"] = 0
                    info["last_seen_second"] = int(video_time_sec)
                
                current_sec = int(video_time_sec)
                if current_sec > info["last_seen_second"]:
                    info["last_seen"] += current_sec - info["last_seen_second"]
                    info["last_seen_second"] = current_sec

                shared_data[key] = info

        time.sleep(config.ANALYSIS_INTERVAL)
        
        # 데이터 전송
        analyzer = DataAnalyzer(shared_data)
        analyzer.send_to_api()


if __name__ == "__main__":
    main()