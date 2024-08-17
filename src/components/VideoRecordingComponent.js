import React, { useState, useRef, useEffect } from "react";
import Countdown from "react-countdown";

const VideoRecordingComponent = ({
  timeLimit,
  setRecordedChunks,
  recordedChunks,
  goToSummary,
}) => {
  const [color, setTimerTextColor] = useState("black");
  const [isRecording, setIsRecording] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const [areCameraAndMicAvailable, setAreCameraAndMicAvailable] =
    useState(false);
  const [timerText, setTimerText] = useState(timeLimit);

  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimer = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setAreCameraAndMicAvailable(true);
      })
      .catch((error) => {
        alert(
          "Your webcam and microphone must be accessible to continue.\nReload the application once they are both accessible and ensure they remain accessible while recording."
        );
        console.error("Error accessing webcam or microphone", error);
        setAreCameraAndMicAvailable(false);
      });

    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRemainingTime((prevTime) => {
          const newTime = prevTime - 1;
          updateTimer(newTime);

          try {
            navigator.mediaDevices
              .getUserMedia({ video: true, audio: true })
              .then(() => {
                console.log("Microphone and camera are accessible.");
              })
              .catch((error) => {
                console.error("Microphone or camera not accessible:", error);
                alert(
                  "Recording failed.\nPlease ensure both the microphone and camera are working and reload the application."
                );
                clearInterval(recordingTimer.current);
                stopRecording();
                setAreCameraAndMicAvailable(false);
              });
          } catch {}

          return newTime;
        });
      }, 1000);
    } else if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    return () => clearInterval(recordingTimer.current);
  }, [isRecording]);

  const updateTimer = (count) => {
    setTimerTextColor(count < 11 ? "red" : "black");
    setTimerText(count > 0 ? count : "Time's Up");

    if (count <= 0) {
      setTimeout(() => {
        stopRecording();
      }, 100);
    }
  };

  function startRecording() {
    setIsReplay(false);
    setIsCountdownActive(true);
    setRemainingTime(timeLimit);
    setTimerText(timeLimit);

    setTimeout(() => {
      setIsRecording(true);
      setRecordedChunks([]);

      try {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = handleDataAvailable;
            mediaRecorderRef.current.start();
          })
          .catch((error) => {
            alert(`Failed to access microphone or webcam.`);
          });

        setIsCountdownActive(false);
      } catch (error) {
        alert(
          "Failed to start recording.\nCould not access either the microphone, webcam or both.\nPlease ensure both are working and accessible, then reload the application."
        );
        setIsRecording(false);
        setIsCountdownActive(false);
      }
    }, 3000);
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function handleDataAvailable(event) {
    if (event.data.size > 0) {
      setRecordedChunks((prev) => [...prev, event.data]);
    }
  }

  function replayRecording() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    setVideoURL(URL.createObjectURL(blob));
    setIsReplay(true);
  }

  function countdownTimer({ seconds, completed }) {
    if (completed) {
      return <span>Go!</span>;
    } else {
      return <span>{seconds}</span>;
    }
  }

  return (
    <div>
      <div className="timer-text">
        <h2 style={{ color, display: isReplay ? "none" : "inline" }}>
          {timerText}
        </h2>
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ display: isReplay ? "none" : "inline" }}
        />
        {isCountdownActive && (
          <div className="overlay-text">
            <Countdown date={Date.now() + 3000} renderer={countdownTimer} />
          </div>
        )}
        {videoURL && isReplay && (
          <video src={videoURL} controls />
        )}
      </div>

      <div className="button-container">
        {!isRecording && !isCountdownActive && areCameraAndMicAvailable && (
          <button onClick={startRecording} className="btn btn-primary">
            Start New Recording
          </button>
        )}

        <button
          onClick={stopRecording}
          style={{
            display: isRecording && !isCountdownActive ? "inline" : "none",
          }}
          className="btn btn-primary"
        >
          Stop Recording
        </button>

        {recordedChunks.length > 0 &&
          !isRecording &&
          !isReplay &&
          !isCountdownActive && (
            <>
              <button
                onClick={replayRecording}
                className="btn btn-primary me-2"
              >
                Replay Recording
              </button>
              <button onClick={goToSummary} className="btn btn-success">
                Next
              </button>
            </>
          )}
      </div>
    </div>
  );
};

export default VideoRecordingComponent;