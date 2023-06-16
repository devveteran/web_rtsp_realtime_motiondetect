import time
from threading import Thread
from camera_stream import TYPE_GENERAL, TYPE_RECORD_TRIGGER, CameraStream
class MainThread:
    def __init__(self):
        self.camera_count = 0
        self.stream_urls = []
        self.cameras = []
        self.stopped = False
        self.recording = False
        self.record_started = False
        self.record_stopped = False
        self.record_triggered = [False, False]
        self.dir_name = ""
        self.t = Thread(target=self.run, args=())
        self.t.daemon = False
        
        self.ws_record_started = False
        self.ws_record_stopped = False
    
    # @property
    def is_record_started(self):
        return self.ws_record_started
    
    # @property
    def is_record_stopped(self):
        return self.ws_record_stopped
    
    def set_record_started(self, b):
        self.ws_record_started = b

    # setter
    def set_record_stopped(self, b):
        self.ws_record_stopped = b

    _ws_record_started = property(is_record_started, set_record_started)
    _ws_record_stopped = property(is_record_stopped, set_record_stopped)

    def setCameras(self, camera_count = 1, urls = [0]):
        self.camera_count = camera_count
        trigger_index = 0
        for i in range(camera_count):
            self.stream_urls.append(urls[i])
            if i == 0 or i == 1: 
                camera = CameraStream(self, index = int(i+1), stream_url=urls[i], type=TYPE_RECORD_TRIGGER, trigger_index=trigger_index)
                trigger_index += 1
            else:
                camera = CameraStream(self, index = int(i+1), stream_url=urls[i], type=TYPE_GENERAL)
            # if i == 0: type = TYPE_RECORD_TRIGGER
            
            self.cameras.append(camera)
    
    def run(self):
        while self.stopped == False:
            if self.recording == True and self.record_started == True:
                self.ws_record_started = True
                self.record_started = False
                for i in range(self.camera_count):
                    self.cameras[i].start_recording(self.dir_name)
            if self.recording == False and self.record_stopped == True:
                self.record_stopped = False
                self.ws_record_stopped = True
                for i in range(self.camera_count):
                    self.cameras[i].stop_recording()
            time.sleep(0.1)
    
    def start(self):
        self.stopped = False
        self.t.start()
        for i in range(self.camera_count):
            self.cameras[i].start()
    
    def trigger_recording(self, index, recording, dir_name=""):
        self.record_triggered[index] = recording
        
        num_triggered = 0
        num_trigger_end = 0
        for t in self.record_triggered:
            if t == True: 
                num_triggered += 1
            else:
                num_trigger_end += 1

        if num_triggered == len(self.record_triggered):
            self.record_started = True
            self.record_stopped = False
            self.recording = True

        if num_trigger_end == len(self.record_triggered):
            self.record_stopped = True
            self.record_started = False
            self.recording = False
        if recording == True:
            self.dir_name = dir_name