import { useState } from 'react'
import React from 'react'
import ReactDom from 'react-dom'
import { Routes, BrowserRouter, Route} from "react-router-dom"
import './App.css'
import Rotes from './routes/routes'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Rotes />
      </div>
    </>
  )
}

export default App
