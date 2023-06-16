import cv2
import time, os
from threading import Thread
from datetime import datetime

dir_path = os.path.dirname(os.path.realpath(__file__))
DURATION = 10

TYPE_GENERAL = 0
TYPE_RECORD_TRIGGER = 1

class CameraStream:
    def __init__(self, parent, index, stream_url = 0, type = TYPE_GENERAL, trigger_index = 0):
        self.parent = parent
        self.mmodel = cv2.createBackgroundSubtractorMOG2()
        self.index = index
        self.stream_url = stream_url
        
        self.trigger_index = trigger_index
        self.first_detected = True
        self.recording = False
        self.recorded_frame_count = 0
        self.out = None
        self.video_name = ""
        self.video_path = ""
        self.duration = 0
        self.prev_time = 0

        self.type = type
        self.vcap = cv2.VideoCapture(self.stream_url)
        if self.vcap.isOpened() is False:
            print("Error accessing the camera {}.".format(self.index))
            # exit(0)
        self.fps_istream = int(self.vcap.get(5))
        if self.fps_istream == 0:
            self.fps_istream = 15
        print("FPS of camera {}: {}".format(self.index, self.fps_istream))

        self.grabbed, self.frame = self.vcap.read()
        self.image_width = 0
        self.image_height = 0
        if self.grabbed is False:
            print('No more frames to read from camera {}'.format(self.index))
        else:
            width = self.frame.shape[1]
            height = self.frame.shape[0]
            self.image_height = int(height * (1024 / width))
            self.image_width = 1024

        self.stopped = False
        self.t = Thread(target=self.update, args=())
        self.t.daemon = False
    
    def setType(self, type):
        self.type = type

    def start(self):
        self.stopped = False
        self.t.start()

    def update(self):
        i = 0
        while self.vcap.isOpened() and self.stopped == False:
            try:
                if self.stopped is True:
                    break
                
                self.grabbed, frame = self.vcap.read()
                
                if self.grabbed is True:
                    width = frame.shape[1]
                    height = frame.shape[0]
                    if self.image_height == 0 or self.image_width == 0:
                        self.image_height = int(height * (1024 / width))
                        self.image_width = 1024
                    self.frame = cv2.resize(frame, (1024, self.image_height))

                    end = time.time()
                    date_string = datetime.now().isoformat(sep=' ', timespec='seconds')

                    # self.frame = frame.copy()
                    fg_mask = self.mmodel.apply(self.frame)
                    _, thresh = cv2.threshold(fg_mask, 127, 255, cv2.THRESH_BINARY)
                    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    motion_detected = False
                    for contour in contours:
                        if cv2.contourArea(contour) > 5000:
                            motion_detected = True
                            (x, y, w, h) = cv2.boundingRect(contour)
                            cv2.rectangle(self.frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                            # cv2.imshow("detected", self.frame)
                    if self.first_detected == True:
                        motion_detected = False
                        self.first_detected = False

                    if (self.type == TYPE_RECORD_TRIGGER and motion_detected == True):
                        if self.recording == False:
                            if end - self.prev_time < 1:
                                continue
                            dir_name = date_string
                            dir_name = dir_name.replace(":", "-")
                            dir_name = dir_name.replace(" ", "-")
                            dir_name = dir_name.replace(".", "-")
                            self.parent.trigger_recording(self.trigger_index, True, dir_name)
                            # self.start_recording(dir_name=dir_name)

                    if self.recording == True:
                        if self.out != None:
                            self.out.write(self.frame)
                        self.recorded_frame_count += 1
                        self.duration += (end - self.prev_time)
                        if self.type == TYPE_RECORD_TRIGGER and self.duration > DURATION:
                            self.parent.trigger_recording(self.trigger_index, False)
                            # self.stop_recording()

                    self.prev_time = end
                    #cv2.imshow(str(self.index), self.frame)
                    #if cv2.waitKey(1) and self.stopped == True:
                    #    self.vcap.release()
                    #    break
                    time.sleep(0.01)
                else:
                    self.vcap.release()
                    self.vcap = cv2.VideoCapture(self.stream_url)
                    if self.vcap.isOpened() is False:
                        print('Error accessing camera {}'.format(self.index))
                    else:
                        continue
            except:
                pass
    
    def read(self):
        return self.frame

    def start_recording(self, dir_name = ""):
        self.recording = True
        self.recorded_frame_count = 0
        self.duration = 0
        self.prev_time = time.time()
        if dir_name != "":
            self.video_path = dir_path + "\\videos\\" + dir_name
        if not os.path.exists(self.video_path):
            os.makedirs(self.video_path)
        self.video_name = self.video_path + "\\" + str(self.index) + ".mp4"
        fourcc = cv2.VideoWriter_fourcc(*'H264')
        self.out = cv2.VideoWriter(self.video_name, fourcc, self.fps_istream, (self.image_width, self.image_height))
        print("camera {} recording".format(self.index))

    def stop_recording(self):
        self.recording = False
        self.video_path = ""
        self.recorded_frame_count = 0
        self.duration = 0
        if self.out != None:
            self.out.release()
            time.sleep(0.05)
        self.out = None
        print("camera {} recorded".format(self.index))

    def stop(self):
        self.stopped = True
        self.vcap.release()