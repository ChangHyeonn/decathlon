# ----torch-reid
import torch
import numpy as np
from torchvision import transforms
from PIL import Image
import torchreid
import hnswlib

class TorchReIDFeatureExtractor:
    def __init__(self, dim=512, space='cosine'):
        self.device = (
            'cuda' if torch.cuda.is_available()
            else 'cpu'
        )

        self.model = torchreid.models.build_model(
            name='osnet_ain_x1_0',
            num_classes=1000,
            pretrained=True
        )
        self.model.to(self.device)
        self.model.eval()

        self.preprocess = transforms.Compose([
            transforms.Resize((256, 128)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225])
        ])

        self.dim = dim
        self.index = hnswlib.Index(space=space, dim=dim)
        self.index.init_index(max_elements=10000, ef_construction=200, M=16)
        self.index.set_ef(50)
        self.index.set_num_threads(4)

        self.feature_map = {}  # idx -> (cam_name, global_id)
        self.next_id = 0

    def extract(self, image: np.ndarray) -> np.ndarray:
        if image.shape[2] == 3:
            image = image[:, :, ::-1]  # BGR to RGB
        pil_img = Image.fromarray(image)
        tensor = self.preprocess(pil_img).unsqueeze(0).to(self.device)
        flipped_tensor = torch.flip(tensor, dims=[3])
        with torch.no_grad():
            feat1 = self.model(tensor)
            feat2 = self.model(flipped_tensor)
        features = (feat1 + feat2) / 2.0
        features = torch.nn.functional.normalize(features, dim=1)
        return features.cpu().numpy().flatten()

    def register_or_match_feature(self, feature: np.ndarray, cam_name: str, threshold: float = 0.65):
        if self.next_id == 0:
            self.index.add_items(feature[np.newaxis, :], [self.next_id])
            self.feature_map[self.next_id] = (cam_name, self.next_id)
            self.next_id += 1
            return self.next_id - 1

        labels, distances = self.index.knn_query(feature, k=1)
        if distances[0][0] < (1 - threshold):
            matched_id = labels[0][0]
            return self.feature_map[matched_id][1]
        else:
            self.index.add_items(feature[np.newaxis, :], [self.next_id])
            self.feature_map[self.next_id] = (cam_name, self.next_id)
            self.next_id += 1
            return self.next_id - 1
