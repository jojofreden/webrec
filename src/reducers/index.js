const initialState = {
  playerRunning: false,
  recording: false,
  progressBarOffset: 0,
  focusedTrackId: -1,
  recordedBlob: null,
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
      })
    case 'SELECT_TRACK':
      console.log("Track selected")
      return Object.assign({}, state, {
        focusedTrackId: action.value,
      })
    case 'FINISH_RECORD':
      console.log("Recording finished")
      return Object.assign({}, state, {
        recordedBlob: action.value,
      })
    default:
      return state
  }
}