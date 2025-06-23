# data sender ----main

from datetime import datetime
import logging
import requests

class DataAnalyzer:
    def __init__(self, shared_data):
        self.shared_data = shared_data
        self.objects = []

    def analyze(self):
        new_objects = []

        for (cam, track_id), info in self.shared_data.items():
            path = info.get("path", [])
            recent_zone = info.get("last_zone")
            last_seen = info.get("last_seen", 0)

            purchase = (
                recent_zone and
                "checkout" in recent_zone.lower() and
                last_seen >= 5
            )
            
            obj_data = {
                "track_id": track_id,
                "current_zone": recent_zone,
                "path_history": path,
                "purchase": purchase
            }
            new_objects.append(obj_data)

        self._update_objects(new_objects)

    def _update_objects(self, new_objects):
        existing = {obj["track_id"]: obj for obj in self.objects}
        for obj in new_objects:
            existing[obj["track_id"]] = obj
        self.objects = list(existing.values())

    def send_to_api(self, api_url="http://13.59.231.133:8080/api/tracking"):
        self.analyze()

        result = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "objects": self.objects,
        }

        try:
            response = requests.post(api_url, json=result)
            if response.status_code == 200:
                print(f"[Succeeded] {api_url}")
            else:
                print(f"[Failed] Status Code : {response.status_code}, Reponse: {response.text}")
        except requests.RequestException as e:
            logging.error(f"[Exception] {e}")

        return result
