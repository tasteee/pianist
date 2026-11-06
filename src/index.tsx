/* @refresh reload */
import { render } from 'solid-js/web'
import '@tasteee/zest'
import '@tasteee/zest/ink.css'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')

render(() => <App />, root!)
