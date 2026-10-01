import React from 'react'
import Barra from './components/Barra'
import Carrito from './pages/Carrito';
import { Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Admin from './pages/Admin'
import './App.css';

const App = () => {
  return (
    <>
    <Barra />
    
    <Routes>
        <Route path='/' element={<Inicio />} />
        <Route path='/login' element={<Login />} />
        <Route path='/registro' element={<Registro />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/carrito" element={<Carrito />} />

    </Routes>
    
    
    </>
  )
}

export default App