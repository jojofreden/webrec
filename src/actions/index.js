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
export const progressBarMove = (value) => {
  return {
    type: 'PROGRESSBAR_MOVE',
    value,
  }
}
export const progressBarDrag = (value) => {
  return {
    type: 'PROGRESSBAR_DRAG',
    value,
  }
}

export const settingClickedTrack = (value) => {
  return {
    type: 'SETTING_CLICKED',
    value,
  }
}

export const trackResizeing = (trackId, startPx) => {
  return {
    type: 'TRACK_RESIZING',
    trackId,
    startPx,
  }
}

export const trackResized = (value) => {
  return {
    type: 'TRACK_RESIZED',
    value,
  }
}

export const timebarClicked = (value) => {
  return {
    type: 'PROGRESSBAR_MOVE',
    value,
  }
}
