import { Route ,Routes } from "react-router-dom"
import AdminLogin from "./pages/Auth/AdminLogin.jsx"
import AdminDashboard from "./components/Dashboard/AdminDashboard.jsx"
import AddPackage from "./components/Sections/AddPackage.jsx"



const App = () => {
  return (
    <>
    
    <Routes>
      <Route path="/" element={<AdminLogin />}/>
      <Route path="/admin" element={<AdminDashboard />}/>
      <Route path="/admin-managePackages" element={<AddPackage />}/>
    </Routes>

    </>
  )
}

export default App