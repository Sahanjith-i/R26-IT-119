import { BrowserRouter, Routes, Route } from "react-router-dom";

// =====================================================
// PAGES
// =====================================================

import Dashboard from "./pages/Dashboard";
import Miners from "./pages/Miners";
import MinerDetails from "./pages/MinerDetails";
import EditMiner from "./pages/EditMiner";
import Alerts from "./pages/Alerts";
import Notifications from "./pages/Notifications";
import HealthMonitoring from "./pages/HealthMonitoring";
import MotionEmergency from "./pages/MotionEmergency";
import EnvironmentalMonitoring from "./pages/EnvironmentalMonitoring";

// =====================================================
// COMPONENTS
// =====================================================

import MinerMap from "./components/MinerMap";


// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            🏠 MAIN DASHBOARD
        ================================================= */}

        <Route
          path="/"
          element={<Dashboard />}
        />


        {/* =================================================
            👷 MINER MANAGEMENT
        ================================================= */}

        <Route
          path="/miners"
          element={<Miners />}
        />

        <Route
          path="/miner/:id"
          element={<MinerDetails />}
        />

        <Route
          path="/edit-miner/:id"
          element={<EditMiner />}
        />


        {/* =================================================
            📡 LIVE MINER LOCATION
        ================================================= */}

        {/* Main map page */}

        <Route
          path="/map"
          element={<MinerMap />}
        />

        {/* Individual miner map */}

        <Route
          path="/map/:id"
          element={<MinerMap />}
        />


        {/* =================================================
            🚨 ALERTS
        ================================================= */}

        <Route
          path="/alerts"
          element={<Alerts />}
        />


        {/* =================================================
            🔔 NOTIFICATIONS
        ================================================= */}

        <Route
          path="/notifications"
          element={<Notifications />}
        />


        {/* =================================================
            ❤️ HEALTH MONITORING
        ================================================= */}

        <Route
          path="/health-monitoring"
          element={<HealthMonitoring />}
        />


        {/* =================================================
            🏃 MOTION & EMERGENCY
        ================================================= */}

        <Route
          path="/motion-emergency"
          element={<MotionEmergency />}
        />


        {/* =================================================
            🌫 ENVIRONMENTAL MONITORING
        ================================================= */}

        <Route
          path="/environmental-monitoring"
          element={<EnvironmentalMonitoring />}
        />


        {/* =================================================
            ❌ 404 / UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

              <div className="text-center">

                <div className="text-6xl mb-4">
                  404
                </div>

                <h1 className="text-2xl font-bold">
                  Page Not Found
                </h1>

                <p className="text-slate-400 mt-2">
                  The requested page does not exist.
                </p>

              </div>

            </div>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;