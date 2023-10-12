import warnings
from camera_stream import TYPE_GENERAL, TYPE_RECORD_TRIGGER, CameraStream
import time, os
import json
from flask import Flask, request
from flask_cors import CORS, cross_origin
from main_thread import MainThread
import sys
import subprocess
warnings.simplefilter("ignore")

mainThread = MainThread()
# mainThread.setCameras(2, ["rtsp://admin:sphere2023@172.16.0.101:554/", "rtsp://admin:sphere2023@172.16.0.112:554/"])
mainThread.setCameras(3, [0, 0, 0])

app = Flask(__name__)
# app.config['CORS_HEADERS'] = 'Content-Type'
# cors = CORS(app)

def get_directories():
    d = "./videos"
    subdirs = [o for o in os.listdir(d) if os.path.isdir(os.path.join(d, o))]
    return subdirs

def list_files(dir):
    d = "./videos/" + dir
    dir_list = os.listdir(d)
    return dir_list

@app.route('/', methods=["GET"])
# @cross_origin()
def get_all_dirs():
    dirs = get_directories()
    return json.dumps({'list': dirs})


@app.route('/files', methods=["GET"])
@cross_origin()
def get_files():
    dir = request.args.get('dir')
    if dir == "":
        return json.dumps({"status":"success", "files":[]})
    files = list_files(dir)
    result = []
    for file in files:
        ind = file.replace(".mp4", "")
        result.append(ind)
    return json.dumps({"status":"success", "files":result})

@app.route('/update', methods=["GET"])
@cross_origin()
def get_info():
    if mainThread.ws_record_started == True:
        mainThread.ws_record_started = False
        return json.dumps({'status': 'recording'})
    if mainThread.ws_record_stopped == True:
        mainThread.ws_record_stopped = False
        if mainThread.dir_name == "":
            return json.dumps({})
        dir_name = mainThread.dir_name
        mainThread.dir_name = ""
        return json.dumps({'status': 'recorded', 'dir': dir_name})
    return json.dumps({'status':'none'})

if __name__ == '__main__':
    port1=int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    port2=int(sys.argv[2]) if len(sys.argv) > 2 else 5010
    subprocess.Popen(['python', 'video_server.py', str(port2)])
    mainThread.start()
    app.run(host="0.0.0.0", port=port1)