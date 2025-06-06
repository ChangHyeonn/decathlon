from deep_sort_realtime.deepsort_tracker import DeepSort

class DeepSortTracker:
    def __init__(self):
        self.tracker = DeepSort(
            max_age=30,
            max_cosine_distance=0.3,
            n_init=3,
            #embedder_gpu=True, # GPU 환경
            embedder_gpu=False
        )

    def update(self, detections, frame):
        dets = []
        for *box, conf, cls in detections:
            x1, y1, x2, y2 = box
            dets.append([[x1, y1, x2 - x1, y2 - y1], conf, 'person'])

        return self.tracker.update_tracks(dets, frame=frame)