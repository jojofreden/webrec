import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {deletePressed, playProject, pauseProject, stopProject, recordProject, selectTrack, finishRecord, progressBarMove, progressBarDrag, settingClickedTrack, trackResizeing, trackResized, timebarClicked} from './actions'
import Player from './components/player.js'
import ProgressBar from './components/progressbar.js'
import Track from './components/track.js'
import Timebar from './components/timebar.js'
import Timer from './components/timer.js'


class App extends Component {
  constructor(props) {
    super(props);
    this.store = this.props.store;
  }

  componentDidMount() {
    window.addEventListener("mouseup", this.mouseUpApp)
    window.addEventListener("mousemove", this.mouseMoveApp)
    window.addEventListener("keydown", this.keyDownApp)
  }

  keyDownApp = (e) => {
    const state = this.store.getState()
    if (e.keyCode === 8) {
      this.store.dispatch(deletePressed())
    }
  };

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
  };

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
        colorNumber={i} />);
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
