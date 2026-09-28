import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { CompanyDetail } from "./pages/CompanyDetail";
import { Goals } from "./pages/Goals";
import { DataStatus } from "./pages/DataStatus";
import { News } from "./pages/News";
import { NavHeader } from "./components/NavHeader";
import { CheckinPrompt } from "./components/CheckinPrompt";

function App() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <NavHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company/:id" element={<CompanyDetail />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/news" element={<News />} />
        <Route path="/data-status" element={<DataStatus />} />
      </Routes>
      <CheckinPrompt />
    </div>
  );
}

export default App;
