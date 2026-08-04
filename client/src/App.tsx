import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { CompanyDetail } from "./pages/CompanyDetail";

function App() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company/:id" element={<CompanyDetail />} />
      </Routes>
    </div>
  );
}

export default App;
