import numpy as np
import faiss
from collections import deque

class GlobalIDMatcher:
    def __init__(self, feature_dim=512, similarity_threshold=0.7, history_size=5):
        self.feature_dim = feature_dim
        self.similarity_threshold = similarity_threshold
        self.history_size = history_size

        self.db_ids = []
        self.feature_history = {}
        self.next_id = 0

        self.index = faiss.IndexFlatIP(feature_dim)

        # cam_name, local_id 할당 기록
        self.id_assignments = {}

    def _get_average_feature(self, global_id):
        feats = np.stack(self.feature_history[global_id])
        avg_feat = np.mean(feats, axis=0)
        avg_feat /= np.linalg.norm(avg_feat) + 1e-12
        return avg_feat

    def register_or_match_feature(self, feat, cam_name, local_id):
        feat = feat.astype(np.float32)
        feat /= np.linalg.norm(feat) + 1e-12

        if len(self.db_ids) == 0:
            global_id = self.next_id
            self.next_id += 1
            self.feature_history[global_id] = deque([feat], maxlen=self.history_size)
            avg_feat = self._get_average_feature(global_id)
            self.index.add(np.expand_dims(avg_feat, axis=0))
            self.db_ids.append(global_id)
            self.id_assignments[global_id] = set()
            self.id_assignments[global_id].add((cam_name, local_id))
            return global_id

        D, I = self.index.search(np.expand_dims(feat, axis=0), k=5)
        for dist, idx in zip(D[0], I[0]):
            if idx == -1:
                continue
            candidate_id = self.db_ids[idx]

            # 같은 카메라 상 id 중복 방지
            assigned_pairs = self.id_assignments.get(candidate_id, set())
            if (cam_name, local_id) not in assigned_pairs:
                if any(cam == cam_name and lid != local_id for cam, lid in assigned_pairs):
                    continue

            avg_feat = self._get_average_feature(candidate_id)
            sim = np.dot(avg_feat, feat)
            if sim > self.similarity_threshold:
                self.feature_history[candidate_id].append(feat)
                self.id_assignments[candidate_id].add((cam_name, local_id))
                return candidate_id

        # 매칭 실패 시 새 ID 생성
        global_id = self.next_id
        self.next_id += 1
        self.feature_history[global_id] = deque([feat], maxlen=self.history_size)
        avg_feat = self._get_average_feature(global_id)
        self.index.add(np.expand_dims(avg_feat, axis=0))
        self.db_ids.append(global_id)
        self.id_assignments[global_id] = set()
        self.id_assignments[global_id].add((cam_name, local_id))

        return global_id
