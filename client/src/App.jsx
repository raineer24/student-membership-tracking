import React from "react";
import { Routes,Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

function App() {
 
  return (
   <AuthProvider>
    <Routes>
      <Route path="/login"  element={<Login />}/>
    </Routes>
   </AuthProvider>
  )
}

export default App
