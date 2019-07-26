import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {playProject, pauseProject, stopProject, recordProject, selectTrack, finishRecord, progressBarMove, progressBarDrag, settingClickedTrack, trackResizeing, trackResized} from '../actions'


class Recording {
  constructor(start, end, audio, trackId) {
    this.start = start
    this.end = end
    this.audio = audio
    this.trackId = trackId
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var source = audioCtx.createMediaElementSource(audio)
    var gainNode = audioCtx.createGain();
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    this.gainNode = gainNode
    this.rec_id = this.create_recording_id()
  }

  mute () {
    this.gainNode.gain.setValueAtTime(0, 0)
  }

  unmute () {
    this.gainNode.gain.setValueAtTime(1, 0)
  }

  create_recording_id () {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  static findRecordingsByTime(trackIds, recordingsByTrackId, time) {
    var resRecordings = []
    for (var i = 0; i < trackIds.length; i++) {
      var recordings = recordingsByTrackId[trackIds[i]]
      if (recordings) {
        for (var j = 0; j < recordings.length; j++) {
          var recording = recordings[j]
          if (recording.start <= time && recording.end >= time) {
            resRecordings.push(recording)
          }
        }
      }
    }
    return resRecordings
  }
}

class Recorder {
  constructor(store) {
    this.store = store;
  };

  startRecording = (stream) => {
    this.mediaRecorder = new window.MediaRecorder(stream, {})
    this.mediaRecorder.ondataavailable = e => {
      this.chunks.push(e.data)
      const state = this.store.getState()
      if (!state.recording) {
        var blob = new window.Blob(this.chunks, {type: 'audio/wav'})
        this.chunks = []
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        var recording = new Recording(
          state.currentStartRecord,
          state.progressBarOffset * state.msPerPixel,
          audio,
          state.focusedTrackId,
        )
        this.store.dispatch(finishRecord(recording))
      }
    }
    this.mediaRecorder.start()
  }

  stop () {
    this.mediaRecorder.stop()
  }

  pause () {
    this.mediaRecorder.pause()
  }

  resume () {
    this.mediaRecorder.resume()
  }

  start () {
    this.chunks = []
    navigator.mediaDevices.getUserMedia({audio: true})
      .then((stream) => this.startRecording(stream))
  }

  render() {
    return false;
  }
}

class Player extends Component {
  constructor(props) {
    super(props);
    this.store = props.store;
    this.recorder = new Recorder(props.store)
  };

  handlePlayButtonClick = () => {
    this.store.dispatch(playProject())
    const state = this.store.getState()
    var currentMsPostition = state.msPerPixel * state.progressBarOffset

    var trackIds = []

    for (var i = 0; i < state.nrTracks; i++) {
      trackIds.push(i)
    }

    var recordings = Recording.findRecordingsByTime(trackIds, state.recordingsByTrackId, currentMsPostition)
    if (recordings) {
      var currentMsPostition = state.msPerPixel * state.progressBarOffset
      for (var i = 0; i < recordings.length; i++) {
        const recording = recordings[i]
        const audio = recording.audio
        audio.currentTime = currentMsPostition/1000

        if (state.mutedTracks[recording.trackId]) {
          recording.mute()
        } else {
          recording.unmute()
        }
        audio.play()
      }
    }
  };

  handlePauseButtonClick = () => {
    if (this.store.getState().recording) {
      this.recorder.pause()
    }

    this.store.dispatch(pauseProject())
  };

  handleRecordStartButtonClick = () => {
    this.store.dispatch(recordProject())
    this.recorder.start()
  };

  handleStopButtonClick = () => {
    if (this.store.getState().recording) {
      this.recorder.stop()
    }
    this.store.dispatch(stopProject())
  };

  render() {
    const playerStyle = {
      position: 'absolute',
      top: '30px',
      left: '10px',
    };

    const playButtonStyle = {
      top: '10px',
      left: '20%',
      outline: 'none',
      borderStyle: 'solid',
      boxSizing: 'border-box',
      borderWidth: '10px 0px 10px 20px',
      borderColor: 'transparent transparent transparent #202020',
    };

    const pauseButtonStyle = {
      outline: 'none',
      borderStyle: 'solid',
      height: '20px',
      borderWidth: '0px 9px 0px 9px',
      padding: '2px',
      marginRight: '12px',
      marginTop: '5px',
      borderColor: '#202020',
    };

    const recordButtonStyle = {
      outline: 'none',
      position: 'absolute',
      height: '22px',
      width: '22px',
      backgroundColor: '#202020',
      borderRadius: '50%',
      marginTop: '4px',
    };

    const recordingButtonStyle = Object.assign({}, recordButtonStyle, {
        backgroundColor: '#FF0000',
      })

    var playPauseStyle = playButtonStyle
    var playPauseHandler = this.handlePlayButtonClick

    if (this.store.getState().playerRunning) {
      playPauseStyle = pauseButtonStyle
      playPauseHandler = this.handlePauseButtonClick
    }

    var recordHandler = this.handleRecordStartButtonClick
    var recordStyle = recordButtonStyle

    if (this.store.getState().recording) {
       recordHandler = this.handleStopButtonClick
       recordStyle = recordingButtonStyle
    }

    return (
      <div style={playerStyle}>
        <button style={playPauseStyle} onClick={playPauseHandler} />
        <button style={recordStyle} onClick={recordHandler} />
      </div>
    );
  }
}

export default Player;
