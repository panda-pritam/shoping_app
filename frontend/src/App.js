import logo from "./logo.svg";
import "./App.css";
import {MyProvider} from "./store/store";
import Home from "./home/home";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import NavBar from "./components/NavBar";
import AddNew from "./components/AddNewPin";
import {ToastContainer, toast} from "react-toastify";
import {useState} from "react";

function App() {
  const [filteredResults, setFilteredResults] = useState(null);
  return (
    <div className="h-screen w-screen bg-green-300">
      <BrowserRouter>
        <MyProvider>
          <div className="w-full h-full">
            <ToastContainer />
            <NavBar setFilteredResults={setFilteredResults} />
            <div className="h-[calc(100vh-4rem)] bg-red-200">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add" element={<AddNew />} />
              </Routes>
            </div>
          </div>
        </MyProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
