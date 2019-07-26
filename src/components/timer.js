import React, { Component } from 'react';

class Timer extends Component {
  constructor(props) {
    super(props);
    this.store = props.store;
  }

  render() {
    var timerStyle = {
      userSelect: 'none',
      position: 'absolute',
      top: '5px',
      left: '10px',
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

export default Timer;
