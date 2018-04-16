import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {playProject, pauseProject, stopProject, recordProject, selectTrack, finishRecord} from './actions'

const nrTracks = 10

const colors = ['#001f3f', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136']

class Recorder {
  constructor(store) {
    this.store = store;
  };

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
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia ||
                              navigator.webkitGetUserMedia)

    if (navigator.getUserMedia && window.MediaRecorder) {
      const constraints = {audio: true}
      this.chunks = []

      const onErr = err => {
        console.warn(err)
      }

      const onSuccess = stream => {
        this.mediaRecorder = new window.MediaRecorder(stream, {})

        this.mediaRecorder.ondataavailable = e => {
          this.chunks.push(e.data)

          if (!this.store.getState().recording) {
            var blob = new window.Blob(this.chunks, {type: 'audio/wav'})
            this.chunks = []
            this.store.dispatch(finishRecord(blob))
          }
        }

        this.mediaRecorder.onerror = onErr
        this.mediaRecorder.start()
      }
      navigator.getUserMedia(constraints, onSuccess, onErr)
    } else {
      console.warn('Audio recording APIs not supported by this browser')
      const { onMissingAPIs } = this.props
      if (onMissingAPIs) {
        onMissingAPIs(navigator.getUserMedia, window.MediaRecorder)
      } else {
        window.alert('Your browser doesn\'t support native microphone recording. For best results, we recommend using Google Chrome or Mozilla Firefox to use this site.')
      }
    }
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
    if (this.store.getState().recordedBlob != null) {
      const audioUrl = URL.createObjectURL(this.store.getState().recordedBlob);
      const audio = new Audio(audioUrl);
      audio.play();
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
      left: '20%',
    };

    const playButtonStyle = {
      outline: 'none',
      borderStyle: 'solid',
      boxSizing: 'border-box',
      width: '74px',
      height: '74px',
      borderWidth: '37px 0px 37px 74px',
      borderColor: 'transparent transparent transparent #202020',
    };

    const pauseButtonStyle = {
      outline: 'none',
      borderStyle: 'solid',
      width: '74px',
      height: '74px',
      borderWidth: '0px 37px 0px 37px',
      borderColor: '#202020',
    };

    const recordButtonStyle = {
      outline: 'none',
      position: 'absolute',
      height: '74px',
      width: '74px',
      backgroundColor: '#202020',
      borderRadius: '50%',
    };

    const recordingButtonStyle = {
      outline: 'none',
      position: 'absolute',
      height: '74px',
      width: '74px',
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
    this.state = {currentOffset: 0}
  };

  render() { 
    const progressBarStyle = {
      position: 'absolute',
      top: 200 + this.state.currentOffset + 'px', 
      left: '0px',
      width: '100%',
      height: '2px',
      backgroundColor: 'black',
    }
    return <div style={progressBarStyle} />
  };

  updateProgressBar = () => {
    if (this.store.getState().playerRunning) {
      this.setState({currentOffset: (this.state.currentOffset+1)%1000});
    }
  };

  componentDidMount() {
    this.setState({currentOffset: 0});
    let timer = setInterval(this.updateProgressBar, 10);
    this.setState({
      timer,
    });
  };
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

  trackFocused = (trackId) => {
    this.store.dispatch(selectTrack(trackId))
  };

  render() {
    var borderWidth = 'thin';

    if (this.store.getState().focusedTrackId == this.trackId) {
      borderWidth = 'thick';
    }

    const trackStyle = {
      position: 'absolute',
      top: '200px',
      bottom: '0px',
      left: this.position + '%',
      width: this.width + '%',
      backgroundColor: colors[this.colorNumber],
      height: '100%',
      borderWidth:  borderWidth,
    };

    return (
      <div style={trackStyle} onClick={this.trackFocused} />
    );
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.store = this.props.store;
    this._tracks = new Map()
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
	   <div className="App" id="app" style={appStyle}>	  
        <Player store={this.store} />
        {tracks}
        <ProgressBar store={this.store} />
	   </div>
    );
  }
}

export default App;
