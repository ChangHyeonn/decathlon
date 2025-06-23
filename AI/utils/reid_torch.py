# reid by torchred

import torch
import numpy as np
from torchvision import transforms
from PIL import Image
import torchreid

class FeatureExtractor:
    def __init__(self, use_flip=True, device=None):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')

        self.model = torchreid.models.build_model(
            #name='osnet_ain_x1_0',
            name='osnet_ibn_x1_0',
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

        self.use_flip = use_flip

    def preprocess_image(self, image: np.ndarray):
        if image.shape[2] == 3:
            image = image[:, :, ::-1] 
        pil_img = Image.fromarray(image)
        return self.preprocess(pil_img)

    def extract_batch(self, images: list):
        tensors = []
        tensors_flipped = []

        for img in images:
            tensor = self.preprocess_image(img)
            tensors.append(tensor)
            if self.use_flip:
                tensors_flipped.append(torch.flip(tensor, dims=[2]))

        batch = torch.stack(tensors).to(self.device)

        with torch.no_grad():
            feat = self.model(batch)
            if self.use_flip:
                batch_flipped = torch.stack(tensors_flipped).to(self.device)
                feat_flip = self.model(batch_flipped)
                features = (feat + feat_flip) / 2.0
            else:
                features = feat

            features = torch.nn.functional.normalize(features, dim=1)

        return features.cpu().numpy()

    def extract(self, image: np.ndarray):
        return self.extract_batch([image])[0]