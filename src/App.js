import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {playProject, pauseProject, stopProject, recordProject, selectTrack, finishRecord, progressBarMove, progressBarDrag, settingClickedTrack, trackResizeing, trackResized, timebarClicked} from './actions'
import Player from './components/player.js'

const colors = ['#4c626e', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136']

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
      height: '3px',
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
      left: 30,
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

class Timebar extends Component {
  constructor(props) {
    super(props);
    this.store = props.store
  };

  timebarFocused = (e) => {
    const state = this.store.getState()
    this.store.dispatch(timebarClicked(e.clientY - state.topOffset))
  };

  render() {
    const state = this.store.getState()
    const style = {
      position: 'absolute',
      top: state.topOffset,
      bottom: '0px',
      left: 0,
      width: state.timebarWidth + "px",
      background: "grey",
      height: '100%',
      boxSizing: 'border-box',
      zIndex: 0,
    };

    var timeMarkers = []
    var currentPos = 0
    for (var i = 0; i < window.innerHeight/(1000/state.msPerPixel); i++) {
      timeMarkers.push(<div style={{
        position: 'absolute',
        top: currentPos + 'px',
        height: '2px',
        width: '100%',
        backgroundColor: 'black',
        zIndex: 1,
      }}
      />);
      currentPos += 1000/state.msPerPixel
    }

    var currentPos = 0
    for (var i = 0; i < window.innerHeight/(100/state.msPerPixel); i++) {
      timeMarkers.push(<div style={{
        position: 'absolute',
        top: currentPos + 'px',
        height: '1px',
        width: '100%',
        backgroundColor: 'black',
        zIndex: 1,
      }}
      />);
      currentPos += 100/state.msPerPixel
    }

    return (
      <div style={style} onClick={this.timebarFocused}>
        {timeMarkers}
      </div>
    );
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
      top: - this.settingsHeight + "px",
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
      var currentWidth = state.trackWidthById[state.trackResizingId]

        var prevWidth = window.innerWidth * 0.01 * currentWidth
        var deltaX = state.trackResizeStartPx - e.clientX
        var movePerc = deltaX/window.innerWidth
      if (5 < currentWidth || movePerc < 0) {
        this.store.dispatch(trackResized(-4*movePerc))
      }
    }
  }
a
  render() {
    const appStyle = {}
    var tracks = []
    const state = this.store.getState()
    var currentPos = 0
    for (var i = 0; i < state.nrTracks; i++) {
      tracks.push(<Track
        store={this.store}
        trackId={i}
        position={currentPos}
        colorNumber={i%colors.length}/>);
      currentPos += state.trackWidthById[i]
    }

    var trackDivStyle = {
      position: 'absolute',
      width: 100*(1-state.timebarWidth/window.innerWidth) + '%',
      height: '100%',
      top:  state.topOffset + 'px',
      left: state.timebarWidth + 'px',
    }

    return (
	   <div className="App" id="app" style={appStyle} >
        <Player store={this.store} />
        <Timer store={this.store} />
        <Timebar store={this.store} />
        <div style={trackDivStyle}>
          {tracks}
        </div>
        <ProgressBar store={this.store} />
	   </div>
    );
  }
}

export default App;
