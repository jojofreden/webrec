
export const time_to_y_px_coordinate = (state, t) => {
    return state.trackSettingsHeight + (t / state.msPerPixel);
};
