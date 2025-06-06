import json
import random
from datetime import datetime, timedelta

zones = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6', 'zone7']
entrance = 'zone_entrance'
checkout = 'zone_checkout'

# 공휴일로 가정할 날짜
holidays = {'2025-06-06','2025-06-03','2025-06-07','2025-06-08','2025-06-01'}  # 현충일

def generate_path():
    path = [entrance]
    n_zones = random.randint(2, 5)
    for _ in range(n_zones):
        path.append(random.choice(zones))
    if random.random() < 0.15:
        path.append(checkout)
    if random.random() < 0.1:
        path.append(entrance)  # 재입장 없이 나간 경우
    return path

track_id_counter = 1
start_date = datetime.strptime("2025-06-01", "%Y-%m-%d")
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

    filename = f"tracking_data_{date_str}.json"
    with open(filename, "w") as f:
        json.dump(result, f, indent=2)

    print(f"{filename} saved.")
