import {Routes, Route} from 'react-router-dom'
import OperatorLogin from './Pages/OperatorsLogin'
import Signup from './Pages/OperatorSignup'
const App = () => {
  return (

    <Routes>
      <Route path='/' element={<div>Home page for latter</div>}/>
      <Route path="/operator/login" element={<OperatorLogin/>} />
      <Route path="/operator/register" element={<Signup/>} />
    </Routes>
  )
}

export default App