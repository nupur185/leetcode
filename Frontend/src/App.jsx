import {Routes, Route, Navigate} from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { checkAuth } from "./authSlice";
import { useDispatch,useSelector } from "react-redux";
import { useEffect } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage";
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import Payment from "./pages/Payment";

function App() {

  const dispatch= useDispatch();
  //  user already authenticated or not
  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);

  useEffect(()=> {
    dispatch(checkAuth());
  },[dispatch]);  //yaha dependency empty v chor skte the, but we put dispatch in it, as dispatch v first time hi call hoga, and hum is useEffect ko v ek baar hi chalana chahte h

   if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element= {isAuthenticated? <Homepage></Homepage>: <Navigate to="/signup"/>}></Route>
        <Route path="/login" element= {isAuthenticated? <Navigate to="/" /> : <Login></Login>}></Route>
        <Route path="/signup" element= {isAuthenticated? <Navigate to="/" /> : <Signup></Signup>}></Route>
        <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin/> : <Navigate to="/"/>}></Route>
        <Route path="/admin/create" element={isAuthenticated && user?.role=== 'admin' ? <AdminPanel /> : <Navigate to="/" />}></Route>
        <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />}></Route>
        <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />}></Route>
        <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />}></Route>
        <Route path="/problem/:problemId"  element={<ProblemPage />}></Route>
        <Route path="/payment"  element={<Payment />}></Route>
      </Routes>
    </>
  )
}

export default App;