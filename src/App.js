import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {playProject, pauseProject, stopProject, recordProject, selectTrack, finishRecord, progressBarMove, progressBarDrag, settingClickedTrack, trackResizeing, trackResized} from './actions'

const colors = ['#4c626e', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136']


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
  }

  mute () {
    this.gainNode.gain.setValueAtTime(0, 0)
  }

  unmute () {
    this.gainNode.gain.setValueAtTime(1, 0)
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
      top: '10px',
      left: '120px',
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
      height: '4px',
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
      userSelect: 'none',
      position: 'absolute',
      top: 10,
      left: 10,
      fontSize: 25,
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
    this.props = props
    this.store = props.store;
    this.colorNumber = props.colorNumber;
    this.trackId = props.trackId;
    this.recordedSectionStyle = {
      position: 'absolute',
      backgroundColor: '#000000',
      opacity: 0.5,
      left: '0px',
      width: '100%',
      borderStyle: 'none',
      boxSizing: 'border-box',
      zIndex: 2,
    }
    this.settingsHeight = 20
  };

  trackFocused = () => {
    this.store.dispatch(selectTrack(this.trackId))
  };

  settingsClicked = () => {
    this.store.dispatch(settingClickedTrack(this.trackId))
  };

  getRecordingSections = () => {
    const state = this.store.getState()
    const recordings = state.recordingsByTrackId[this.trackId]
    var recordedSections = []
    for (var i = 0; i < recordings.length; i++) {
      const recording = recordings[i]

      var cRecordedSectionStyle = Object.assign({}, this.recordedSectionStyle, {
        top: ((recording.start/state.msPerPixel) + this.settingsHeight | 0),
        height: (((recording.end-recording.start)/state.msPerPixel) | 0)
      })
      
      recordedSections.push(<div style={cRecordedSectionStyle} />)
    }
    return recordedSections
  }

  getCurrentRecordingSection = () => {
    const state = this.store.getState()
    var cRecordedSectionStyle = Object.assign({}, this.recordedSectionStyle, {
      top: ((state.currentStartRecord/state.msPerPixel) + this.settingsHeight),
      height: ((state.progressBarOffset - (state.currentStartRecord/state.msPerPixel))),
    })
      
    return <div style={cRecordedSectionStyle} />
  }

  mouseDown = (e) => {
    this.store.dispatch(trackResizeing(this.trackId, e.clientX))
  };

  render() {
    var borderStyle = 'none';
    var borderWidth = 0
    var zIndex = 0
    const state = this.store.getState()
    var recordingSections = []

    if (state.focusedTrackId == this.trackId) {
      borderStyle = 'solid';
      borderWidth = 1
      var zIndex = 1

      if (state.recording) {
        recordingSections.push(this.getCurrentRecordingSection())
      }
    }

    const recordings = state.recordingsByTrackId[this.trackId]

    if (recordings) {
      recordingSections = recordingSections.concat(this.getRecordingSections())
    }

    const trackStyle = {
      position: 'absolute',
      top: state.topOffset - this.settingsHeight + "px",
      bottom: '0px',
      left: this.props.position + '%',
      width: state.trackWidthById[this.trackId] + '%',
      backgroundColor: colors[this.colorNumber],
      height: '100%',
      borderStyle:  borderStyle,
      borderWidth: borderWidth,
      boxSizing: 'border-box',
      zIndex: zIndex,
    };

    const muted = state.mutedTracks[this.trackId]

    const settingsStyle = {
      position: 'absolute',
      width: '100%',
      backgroundColor: muted ? '#A9A9A9' : '#D3D3D3',
      height: (20 - borderWidth) + 'px',
      boxSizing: 'border-box',
      zIndex: zIndex,
    };
    
    return (
      <div style={trackStyle} onClick={this.trackFocused} onMouseDown={this.mouseDown}>
        <div 
            style={settingsStyle} 
            onClick={this.settingsClicked} />
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
    const state = this.store.getState()
    if (state.progressBarDragging) {
      this.store.dispatch(progressBarDrag(false))
    }
    if (state.trackResizingId != -1) { 
      this.store.dispatch(trackResizeing(-1))
    }
  };

  mouseMoveApp = (e) => {
    const state = this.store.getState()

    if (state.progressBarDragging) { 
      var prevY = state.topOffset + state.progressBarOffset
      var deltaY = prevY - e.clientY

      this.store.dispatch(progressBarMove(Math.max(0, state.progressBarOffset - deltaY)))
    }
    if (state.trackResizingId != -1) { 
      var prevWidth = window.innerWidth * 0.01 * state.trackWidthById[state.trackResizingId]
      var deltaX = state.trackResizeStartPx - e.clientX 
      var movePerc = deltaX/window.innerWidth
      this.store.dispatch(trackResized(movePerc))
    }
  }

  render() {
    const appStyle = {}
    var tracks = []
    var currentPos = 0
    const state = this.store.getState()

    for (var i = 0; i < state.nrTracks; i++) {
      tracks.push(<Track 
        store={this.store} 
        trackId={i} 
        position={currentPos} 
        colorNumber={i%colors.length}/>);
      currentPos += state.trackWidthById[i]
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
