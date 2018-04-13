import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

const nrTracks = 10

const colors = ['#001f3f', '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136']


class Recorder extends Component {
  constructor(props) { 
    super(props);
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
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia ||
                              navigator.webkitGetUserMedia)

    if (navigator.getUserMedia && window.MediaRecorder) {
      const constraints = {audio: true}
      this.chunks = []
      const { blobOpts, onStop, onError, mediaOpts, onPause, onResume, onStart, gotStream } = this.props

      const onErr = err => {
        console.warn(err)
        if (onError) onError(err)
      }

      const onSuccess = stream => {
        this.mediaRecorder = new window.MediaRecorder(stream, mediaOpts || {})

        this.mediaRecorder.ondataavailable = e => {
          this.chunks.push(e.data)
        }

        this.mediaRecorder.onstop = e => {
          const blob = new window.Blob(this.chunks, blobOpts || {type: 'audio/wav'})
          this.chunks = []
          onStop(blob)
        }

        this.mediaRecorder.onerror = onErr
        if (onPause) this.mediaRecorder.onpause = onPause
        if (onResume) this.mediaRecorder.onresume = onResume
        if (onStart) this.mediaRecorder.onstart = onStart
        this.stream = stream
        if (gotStream) gotStream(stream)
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
    this.state = {playerRunning: false}
  }

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
    var playPauseHandler = this.props.handlePlayButtonClick

    if (this.props.playerRunning) {
      playPauseStyle = pauseButtonStyle
      playPauseHandler = this.props.handlePauseButtonClick
    }

    var recordHandler = this.props.handleRecordStartButtonClick
    var recordStyle = recordButtonStyle

    if (this.props.recording) {
       recordHandler = this.props.handleRecordStopButtonClick
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
    this.state = {currentOffset: 0}
    this.updateProgressBar=this.updateProgressBar.bind(this);
  }

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
  }

  updateProgressBar() {
    if (this.props.playerRunning) {
      this.setState({currentOffset: (this.state.currentOffset+1)%1000});
    }
  }

  componentDidMount() {
    this.setState({currentOffset: 0});
    let timer = setInterval(this.updateProgressBar, 10);
    this.setState({
      timer,
    });
  }
}

class Track extends Component { 
  constructor(props) {
    super(props);
    this.state = {
      width: props.width,
      position: props.position,
      colorNumber: props.colorNumber,
      trackId: props.trackId,
    };
    this.select = this.select.bind(this);
    this.trackFocused = this.trackFocused.bind(this);
  }

  select() {
    this.setState({selected: true})
  }

  trackFocused() {
      this.props.trackFocusHandler(this.props.trackId)
  }

  render() {
    var borderWidth = 'thin';

    if (this.state.selected) {
      borderWidth = 'thick';
    }

    const trackStyle = {
      position: 'absolute',
      top: '200px',
      bottom: '0px',
      left: this.state.position + '%',
      width: this.state.width + '%',
      backgroundColor: colors[this.state.colorNumber],
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
    this._tracks = new Map()
    this.state = {
      playerRunning: false,
      recording: false,
      audioTmp: null,
      tracks: {},
    }
    this.handlePlayButtonClick = this.handlePlayButtonClick.bind(this);
    this.handlePauseButtonClick = this.handlePauseButtonClick.bind(this);
    this.handleRecordStartButtonClick = this.handleRecordStartButtonClick.bind(this);
    this.handleRecordStopButtonClick = this.handleRecordStopButtonClick.bind(this);
    this.handleRecordingFinished = this.handleRecordingFinished.bind(this);
    this.trackFocusHandler = this.trackFocusHandler.bind(this);
  }

  handlePlayButtonClick() {
    this.setState({playerRunning: true})
    const audioUrl = URL.createObjectURL(this.state.audioTmp);
    const audio = new Audio(audioUrl);
    audio.play();
  };

  handlePauseButtonClick() {
    this.setState({playerRunning: false})
  };

  handleRecordStartButtonClick() {
    this._recorder.start()
    this.setState({recording: true})
    this.setState({playerRunning: true})
  };

  handleRecordStopButtonClick() {
    this._recorder.stop()
    this.setState({recording: false})
    this.setState({playerRunning: false})
  };

  handleRecordingFinished(blob) {
    this.setState({audioTmp: blob})
  }

  trackFocusHandler(trackId) {
    this.setState({selectedTrack: trackId})
    console.log(trackId)
    console.log(this._tracks)
    console.log(this._tracks.get(trackId))
    //this._tracks[trackId].select()
  }

  render() {
    const appStyle = {}
    var tracks = []
    var currentPos = 0

    for (var i = 0; i < nrTracks; i++) {
      var width= 100/nrTracks
      tracks.push(<Track 
        ref={(track) => {this._tracks.set(i, track)}}
        trackId={i} 
        trackFocusHandler={this.trackFocusHandler} 
        width={width} 
        position={currentPos} 
        colorNumber={i%colors.length}/>);
      currentPos += width
    }

    return (
	   <div className="App" id="app" style={appStyle}>	  
        <Recorder ref={(recorder) => { this._recorder = recorder; }} onStop={this.handleRecordingFinished} />
        <Player 
          handlePlayButtonClick={this.handlePlayButtonClick} 
          handlePauseButtonClick={this.handlePauseButtonClick} 
          handleRecordStartButtonClick={this.handleRecordStartButtonClick}
          handleRecordStopButtonClick={this.handleRecordStopButtonClick}
          playerRunning={this.state.playerRunning} 
          recording={this.state.recording}
        />
        {tracks}
        <ProgressBar playerRunning={this.state.playerRunning} />
	   </div>
    );
  }
}

export default App;
