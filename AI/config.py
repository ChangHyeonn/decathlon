VIDEO_NAMES = [] #목적에 맞추어 추가 및 작성
ANALYSIS_INTERVAL = 1.5 # 분석 interval
FPS = 15 # fps 설정
VIDEO_PATHS = { # 목적에 맞추어 비디오 path 추가 및 작성
            "cam01": ""
        }
CAM_ZONES = { # 목적에 맞추어 cam, 구역 추가 및 작성, zone에 'zone_checkout'은 필수
            'cam01': {
                'zone1': [  # 계산대 옆
                    [], # zone의 좌표, x와 y 값
                    [],
                    [],
                    []
                ],
                'zone_checkout' : [
                    [],
                    [],
                    [],
                    [],
                    []
                ]
            }
        }