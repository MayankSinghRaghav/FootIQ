import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MatchProvider } from "./context/MatchContext";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Coach from "./pages/Coach";
import HistoryPage from "./pages/HistoryPage";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <MatchProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </MatchProvider>
    </BrowserRouter>
  );
}
