import { useEffect, useState } from "react";

import Login from "./pages/Login/Login";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import News from "./pages/News/News";
import Team from "./pages/Team/Team";
import Events from "./pages/Events/Events";
import Alumni from "./pages/Alumni/Alumni";
import Contact from "./pages/Contact/Contact";
import EasterEgg from "./pages/EasterEgg/EasterEgg";
import Admin from "./pages/Admin/Admin";


function App() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    if (
      window.location.pathname === "/login" ||
      window.location.pathname === "/admin"
    ) {
      return;
    }

    const visitRecorded = sessionStorage.getItem(
      "tp_visit_recorded"
    );

    if (visitRecorded) {
      return;
    }

    sessionStorage.setItem(
      "tp_visit_recorded",
      "true"
    );

    fetch("/api/admin/analytics/visit", {
      method: "POST",
    }).catch(() => {
      sessionStorage.removeItem("tp_visit_recorded");
    });
  }, []);

  if (window.location.pathname === "/login") {
    return (
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
  }

  if (window.location.pathname === "/admin") {
    return (
      <AuthProvider>
        <Admin />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      {showEasterEgg ? (
        <EasterEgg onBack={() => setShowEasterEgg(false)} />
      ) : (
        <>
          <Home onEasterEgg={() => setShowEasterEgg(true)} />
          <About />
          <News />
          <Team />
          <Events />
          <Alumni />
          <Contact />
        </>
      )}
    </AuthProvider>
  );
}

export default App;
