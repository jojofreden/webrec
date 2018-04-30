import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {playProject, pauseProject, stopProject, recordProject, selectTrack, finishRecord, progressBarMove, progressBarDrag} from './actions'

const nrTracks = 10

const colors = ['#4c626e', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136']


class Recording {
  constructor(start, end, audio) {
    this.start = start
    this.end = end
    this.audio = audio
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

    for (var i = 0; i < nrTracks; i++) {
      trackIds.push(i)
    }

    var recordings = Recording.findRecordingsByTime(trackIds, state.recordingsByTrackId, currentMsPostition)
    console.log("NR RECORDINGS: " + recordings.length)
    if (recordings) {
      var currentMsPostition = state.msPerPixel * state.progressBarOffset
      for (var i = 0; i < recordings.length; i++) {
        const recording = recordings[i]
        const audio = recording.audio
        audio.currentTime = currentMsPostition/1000
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
      top: '10px',
      left: '150px',
    };

    const playButtonStyle = {
      top: '10px',
      left: '20%',
      outline: 'none',
      borderStyle: 'solid',
      boxSizing: 'border-box',
      borderWidth: '17px 0px 17px 32px',
      borderColor: 'transparent transparent transparent #202020',
    };

    const pauseButtonStyle = {
      outline: 'none',
      borderStyle: 'solid',
      height: '34px',
      borderWidth: '0px 16px 0px 16px',
      padding: '2px',
      borderColor: '#202020',
    };

    const recordButtonStyle = {
      outline: 'none',
      position: 'absolute',
      height: '38px',
      width: '38px',
      backgroundColor: '#202020',
      borderRadius: '50%',
    };

    const recordingButtonStyle = {
      outline: 'none',
      position: 'absolute',
      height: '38px',
      width: '38px',
      backgroundColor: '#FF0000',
      borderRadius: '50%',
    };

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

class ProgressBar extends Component {
  constructor(props) {
    super(props);
    this.store = props.store
  };

  mouseDown = (e) => {
    this.store.dispatch(progressBarDrag(true))
  };

  render() { 
    const progressBarStyle = {
      position: 'absolute',
      top: this.store.getState().topOffset + this.store.getState().progressBarOffset + 'px', 
      left: '0px',
      width: '100%',
      height: '2px',
      backgroundColor: 'black',
      zIndex: '2',
      cursor: 'ns-resize',
    }

    return <div 
              style={progressBarStyle} 
              onMouseDown={this.mouseDown} 
            />
  };

  updateProgressBar = () => {
    if (this.store.getState().playerRunning) {
      this.store.dispatch(progressBarMove((this.store.getState().progressBarOffset+1)%1000));
    }
  };

  componentDidMount() {
    let timer = setInterval(this.updateProgressBar, this.store.getState().msPerPixel);
    this.setState({
      timer,
    });
  };
}

class Timer extends Component { 
  constructor(props) {
    super(props);
    this.store = props.store;
  }

  render() {
    var timerStyle = {
      position: 'absolute',
      top: 10,
      left: 10,
      fontSize: 30,
    }

    const state = this.store.getState()
    var currentMsPostition = state.msPerPixel * state.progressBarOffset
    var min = currentMsPostition / (60*1000) | 0
    var sec = (currentMsPostition / 1000) % (60*1000) | 0
    var ms = currentMsPostition % 1000 | 0

    return <div style={timerStyle}> {min}:{sec}:{ms}</div>
  }

}

class Track extends Component { 
  constructor(props) {
    super(props);
    this.store = props.store;
    this.width = props.width;
    this.position = props.position;
    this.colorNumber = props.colorNumber;
    this.trackId = props.trackId;
  };

  trackFocused = () => {
    this.store.dispatch(selectTrack(this.trackId))
  };

  getRecordingSections = () => {
    const state = this.store.getState()
    const recordings = state.recordingsByTrackId[this.trackId]
    var recordedSections = []
    for (var i = 0; i < recordings.length; i++) {
      const recording = recordings[i]
      var recordedSectionStyle = {
        position: 'absolute',
        backgroundColor: '#000000',
        opacity: 0.5,
        left: '0px',
        width: '100%',
        borderStyle: 'none',
        zIndex: 2,
      }
      recordedSectionStyle.top = ((recording.start/state.msPerPixel) | 0)
      recordedSectionStyle.height = (((recording.end-recording.start)/state.msPerPixel) | 0)
      recordedSections.push(<div style={recordedSectionStyle} />)
    }
    return recordedSections
  }

  render() {
    var borderStyle = 'none';
    var zIndex = 0

    if (this.store.getState().focusedTrackId == this.trackId) {
      borderStyle = 'solid';
      var zIndex = 1
    }

    const state = this.store.getState()

    const trackStyle = {
      position: 'absolute',
      top: state.topOffset + "px",
      bottom: '0px',
      left: this.position + '%',
      width: this.width + '%',
      backgroundColor: colors[this.colorNumber],
      height: '100%',
      borderStyle:  borderStyle,
      zIndex: zIndex,
    };

    const recordings = state.recordingsByTrackId[this.trackId]

    var recordingSections = []
    if (recordings) {
      recordingSections = this.getRecordingSections()
    }

    return (
      <div style={trackStyle} onClick={this.trackFocused}>
        {recordingSections}
      </div>
    );
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.store = this.props.store;
  }

  componentDidMount() {
    window.addEventListener("mouseup", this.mouseUpApp)
    window.addEventListener("mousemove", this.mouseMoveApp)
  }

  mouseUpApp = (e) => { 
    if (this.store.getState().progressBarDragging) {
      this.store.dispatch(progressBarDrag(false))
    }
  };

  mouseMoveApp = (e) => {
    if (this.store.getState().progressBarDragging) { 
      var state = this.store.getState()
      var prevY = state.topOffset + state.progressBarOffset
      var deltaY = prevY - e.clientY

      this.store.dispatch(progressBarMove(Math.max(0, state.progressBarOffset - deltaY)))
    }
  }

  render() {
    const appStyle = {}
    var tracks = []
    var currentPos = 0

    for (var i = 0; i < nrTracks; i++) {
      var width= 100/nrTracks
      tracks.push(<Track 
        store={this.store} 
        trackId={i} 
        width={width} 
        position={currentPos} 
        colorNumber={i%colors.length}/>);
      currentPos += width
    }

    return (
	   <div className="App" id="app" style={appStyle} >	  
        <Player store={this.store} />
        <Timer store={this.store} />
        {tracks}
        <ProgressBar store={this.store} />
	   </div>
    );
  }
}

export default App;
