const timebarWidth = 20
const nrTracks = 10;
const trackWidthById = {};
for (var i = 0 ; i < nrTracks; i++) {
  trackWidthById[i] = 100/nrTracks;
}

const initialState = {
  playerRunning: false,
  recording: false,
  progressBarOffset: 0,
  focusedTrackId: 0,
  recordingsByTrackId: {},
  progressBarDragging: false,
  trackResizingId: -1,
  trackResizeStartPx: -1,
  topOffset: 80,
  msPerPixel: 15,
  currentStartRecord: -1,
  mutedTracks: {},
  trackWidthById: trackWidthById,
  nrTracks: nrTracks,
  timebarWidth: timebarWidth,
  trackSettingsHeight: 20,
  focusedRecordingId: null,
}

export default (state = initialState, action) => {
  console.log(action.type)
  switch (action.type) {
    case 'PLAY_PROJECT':
      return Object.assign({}, state, {
        playerRunning: true,
      })
    case 'PAUSE_PROJECT':
      return Object.assign({}, state, {
        playerRunning: false,
        recording: false,
      })
    case 'STOP_PROJECT':
      return Object.assign({}, state, {
        playerRunning: false,
        recording: false,
      })
    case 'RECORD_PROJECT':
      return Object.assign({}, state, {
        recording: true,
        playerRunning: true,
        currentStartRecord: state.progressBarOffset * state.msPerPixel,
      })
    case 'SELECT_TRACK':
      return Object.assign({}, state, {
        focusedTrackId: action.value,
      })
    case 'SETTING_CLICKED':
      state.mutedTracks[action.value] = !state.mutedTracks[action.value]
      return Object.assign({}, state, {
        mutedTracks: state.mutedTracks
      })
    case 'FINISH_RECORD':
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
    case 'TRACK_RESIZING':
      return Object.assign({}, state, {
        trackResizingId: action.trackId,
        trackResizeStartPx: action.startPx
      })
    case 'RECORDING_CLICKED':
      return Object.assign({}, state, {
        focusedRecordingId: action.value
      })
    case 'DELETE_PRESSED':
      if (state.focusedRecordingId != null) {
        for (var track in state.recordingsByTrackId) {
          var recordings = state.recordingsByTrackId[track]
          for (var i = 0; i < recordings.length; i++) {
            if (recordings[i].rec_id === state.focusedRecordingId) {
              recordings.splice(i, 1)
              break
            }
          }
        }
      }
      return state

    case 'TRACK_RESIZED':
      var sizeDelta = action.value
      var trackDelta = (sizeDelta / (nrTracks - 1))
      var trackWidthById = {}
      for (var key in state.trackWidthById) {
        var track = state.trackWidthById[key]
        if (state.trackResizingId != key) {
          track -= trackDelta
        } else {
          track += sizeDelta
        }
        trackWidthById[key] = track
      }
      return Object.assign({}, state, {
        trackWidthById: trackWidthById
      })
    default:
      return state
  }
}
