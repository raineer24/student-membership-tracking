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

      <Route path="*" element={<div>404 Not Found</div>}/>
    </Routes>
   </AuthProvider>
  )
}

export default App
