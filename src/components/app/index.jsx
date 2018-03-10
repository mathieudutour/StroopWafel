import React from 'react'
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'

const App = ({ children }) => <div className="app">{children}</div>

export default DragDropContext(HTML5Backend)(App)
