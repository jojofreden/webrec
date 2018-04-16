import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { createStore } from 'redux';
import myApp from './reducers';

registerServiceWorker();
let store = createStore(myApp);

function render() {
  ReactDOM.render(<App store={store} />, document.getElementById('root'));
}

store.subscribe(render);

render();
