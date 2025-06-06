# 데이터 시현용
import random
import time
import requests
from datetime import datetime, timedelta

zones = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6', 'zone7']
entrance = 'zone_entrance'
checkout = 'zone_checkout'

# 공휴일
holidays = {'2025-06-06','2025-06-03','2025-06-07','2025-06-08','2025-06-01'}

def generate_path():
    path = [entrance]
    n_zones = random.randint(2, 5)
    for _ in range(n_zones):
        path.append(random.choice(zones))
    if random.random() < 0.15:
        path.append(checkout)
    if random.random() < 0.1:
        path.append(entrance)
    return path

track_id_counter = 1
start_date = datetime.strptime("2025-06-01", "%Y-%m-%d")
api_url = "http://127.0.0.1:8000/api/tracking"

for day in range(10):
    current_date = start_date + timedelta(days=day)
    date_str = current_date.strftime("%Y-%m-%d")
    is_holiday = date_str in holidays
    people_count = random.randint(140, 160) if is_holiday else random.randint(90, 110)

    objects = []

    for _ in range(people_count):
        path = generate_path()
        purchase = checkout in path and path[-1] != entrance
        obj = {
            "track_id": track_id_counter,
            "current_zone": path[-1],
            "path_history": path,
            "purchase": purchase
        }
        objects.append(obj)
        track_id_counter += 1

    result = {
        "date": date_str,
        "objects": objects
    }

    try:
        response = requests.post(api_url, json=result)
        if response.status_code == 200:
            print(f"Data for {date_str} sent successfully.")
        else:
            print(f"Failed to send data for {date_str}. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending data for {date_str}: {e}")

    time.sleep(1.5)