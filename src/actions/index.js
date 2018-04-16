export const playProject = () => {
  return {
    type: 'PLAY_PROJECT'
  }
}
export const pauseProject = () => {
  return {
    type: 'PAUSE_PROJECT'
  }
}
export const stopProject = () => {
  return {
    type: 'STOP_PROJECT'
  }
}
export const recordProject = () => {
  return {
    type: 'RECORD_PROJECT'
  }
}
export const selectTrack = (value) => {
  return {
    type: 'SELECT_TRACK',
    value,
  }
}
export const finishRecord = (value) => {
  return {
    type: 'FINISH_RECORD',
    value,
  }
}