import React, { Component } from 'react';
import {recordingClicked, selectTrack, finishRecord, settingClickedTrack, trackResizeing, trackResized} from '../actions'
import {time_to_y_px_coordinate} from '../lib/time.js'

export const colors = ['#2C2C2C', '#1F1F1F'];

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
      opacity: 0.4,
      left: '0px',
      width: '100%',
      borderStyle: 'none',
      boxSizing: 'border-box',
      zIndex: 2,
    }
  };

  trackFocused = () => {
    this.store.dispatch(selectTrack(this.trackId))
  };

  settingsClicked = () => {
    this.store.dispatch(settingClickedTrack(this.trackId))
  };

  recordingSelected = (recordingId) => {
    this.store.dispatch(recordingClicked(recordingId))
  };

  getRecordingSections = () => {
    const state = this.store.getState()
    const recordings = state.recordingsByTrackId[this.trackId]
    var recordedSections = []

    var top_padding = this.isSelected() ? -1 : 0

    for (var i = 0; i < recordings.length; i++) {
      const recording = recordings[i]

      var cRecordedSectionStyle = Object.assign({}, this.recordedSectionStyle, {
        top: time_to_y_px_coordinate(state, recording.start),
        height: (recording.end-recording.start)/state.msPerPixel,
        width: '100%',
        opacity: state.focusedRecordingId == recording.rec_id ? 0.7 : 0.4,
        backgroundColor: '#00008b'
      })

      recordedSections.push(<div
                            style={cRecordedSectionStyle}
                            onClick={(e) => this.recordingSelected(recording.rec_id)} />)
    }
    return recordedSections
  };

  getCurrentRecordingSection = () => {
    var top_padding = this.isSelected() ? -1 : 0;
    const state = this.store.getState();
    var cRecordedSectionStyle = Object.assign({}, this.recordedSectionStyle, {
      position: 'absolute',
      top: time_to_y_px_coordinate(state, state.currentStartRecord),
      height: (state.progressBarOffset - (state.currentStartRecord/state.msPerPixel)),
      width: '100%',
      backgroundColor: '#00008b',
    })

    return <div style={cRecordedSectionStyle} />
  };

  isSelected = () => { return this.store.getState().focusedTrackId == this.trackId};

  mouseDown = (e) => {
    this.store.dispatch(trackResizeing(this.trackId, e.clientX))
  };

  render() {
    var borderStyle = 'none';
    var borderWidth = 0
    var zIndex = 0
    const state = this.store.getState()
    var recordingSections = []

    if (this.isSelected()) {
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

    var top_padding = this.isSelected() ? -1 : 0

    const trackStyle = {
      position: 'absolute',
      top: - state.trackSettingsHeight + top_padding + 'px',
      bottom: '0px',
      left: this.props.position + '%',
      width: state.trackWidthById[this.trackId] + '%',
      backgroundColor: colors[this.colorNumber % colors.length],
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
      backgroundColor: muted ? '#A4A4A4' : '#6F6E6E',
      height: state.trackSettingsHeight + 'px',
      zIndex: zIndex,
    };

    return (
      <div style={trackStyle} onClick={this.trackFocused} onMouseDown={this.mouseDown}>
        <div style={settingsStyle} onClick={this.settingsClicked} />
        {recordingSections}
      </div>
    );
  };
}

export default Track;
