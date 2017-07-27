### instructions 

1. run container with :   docker run -p 9000:9000 -p 8000:8000 -t -i bamos/openface /bin/bash -l -c '/root/openface/demos/web/start-servers.sh'
2. start api 


3.running video 
google-chrome --use-fake-device-for-media-stream --use-file-for-fake-video-capture="maty.y4m" --use-file-for-fake-video-capture="maty.y4m"


4.stram video
 ffmpeg -re -i obama.mp4 -vcodec copy -f mpegts udp://234.234.234.234:12345