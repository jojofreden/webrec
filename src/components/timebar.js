import React, { Component } from 'react';
import {timebarClicked} from '../actions'

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

export default Timebar;
