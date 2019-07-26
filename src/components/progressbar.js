import React, { Component } from 'react';
import {progressBarMove, progressBarDrag} from '../actions'


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

    return <div style={progressBarStyle} onMouseDown={this.mouseDown} />
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

export default ProgressBar;
