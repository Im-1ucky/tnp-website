import { useState } from "react";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Team from "./pages/Team/Team";
import Events from "./pages/Events/Events";
import Contact from "./pages/Contact/Contact";
import EasterEgg from "./pages/EasterEgg/EasterEgg";
import Alumni from "./pages/Alumni/Alumni";

function App() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  if (showEasterEgg) {
    return (
      <EasterEgg
        onBack={() => setShowEasterEgg(false)}
      />
    );
  }

  return (
    <>
      <Home onEasterEgg={() => setShowEasterEgg(true)} />
      <About />
      <Team />
      <Events />
      <Alumni />
      <Contact />
    </>
  );
}

export default App;
