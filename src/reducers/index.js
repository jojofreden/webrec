const initialState = {
  playerRunning: false,
  recording: false,
  progressBarOffset: 0,
  focusedTrackId: 0,
  recordingsByTrackId: {},
  progressBarDragging: false,
  topOffset: 70,
  msPerPixel: 15,
  currentStartRecord: -1,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'PLAY_PROJECT':
      console.log("Project playing")
      return Object.assign({}, state, {
        playerRunning: true,
      })
    case 'PAUSE_PROJECT':
      console.log("Project paused")
      return Object.assign({}, state, {
        playerRunning: false,
        recording: false,
      })
    case 'STOP_PROJECT':
      console.log("Project stopped")
      return Object.assign({}, state, {
        playerRunning: false,
        recording: false,
      })
    case 'RECORD_PROJECT':
      console.log("Project recording")
      return Object.assign({}, state, {
        recording: true,
        playerRunning: true,
        currentStartRecord: state.progressBarOffset * state.msPerPixel,
      })
    case 'SELECT_TRACK':
      console.log("Track selected")
      return Object.assign({}, state, {
        focusedTrackId: action.value,
      })
    case 'FINISH_RECORD':
      console.log("Recording finished")
      const recordingsByTrackId = state.recordingsByTrackId
      if (recordingsByTrackId[state.focusedTrackId] == null) {
        recordingsByTrackId[state.focusedTrackId] = []
      }
      recordingsByTrackId[state.focusedTrackId].push(action.value)
      return Object.assign({}, state, {
        recordingsByTrackId: recordingsByTrackId,
      })
    case 'PROGRESSBAR_MOVE':
      return Object.assign({}, state, {
        progressBarOffset: action.value,
      })
    case 'PROGRESSBAR_DRAG':
      return Object.assign({}, state, {
        progressBarDragging: action.value,
      })
    default:
      return state
  }
}