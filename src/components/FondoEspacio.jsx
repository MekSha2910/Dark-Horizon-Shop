import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const FondoEspacio = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // loadSlim carga solo lo necesario para que sea muy rápido
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const opcionesEspacio = {
    background: {
      color: { value: "transparent" },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" }, // Las partículas huyen un poco del mouse
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
      },
    },
    particles: {
      color: { value: ["#dbeafe", "#a5b4fc", "#6ee7b7", "#ffffff"] }, // Colores de DHS
      links: {
        color: "#5e8fe5",
        distance: 150,
        enable: true,
        opacity: 0.2,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: true,
        speed: 0.5, // Movimiento lento como en el espacio
        straight: false,
      },
      number: {
        density: { enable: true, area: 800 },
        value: 80, // Cantidad de estrellas/partículas
      },
      opacity: {
        value: { min: 0.1, max: 0.8 },
        animation: {
          enable: true,
          speed: 1,
          sync: false,
        },
      },
      shape: { type: "circle" },
      size: {
        value: { min: 1, max: 3 },
      },
      shadow: {
        enable: true,
        blur: 15,
        color: "#6ee7b7" // Efecto de luz dinámica o resplandor
      }
    },
    detectRetina: true,
  };

  if (init) {
    return (
      <div className="fondo-espacio">
        <Particles id="tsparticles" options={opcionesEspacio} />
      </div>
    );
  }

  return null;
};

export default FondoEspacio;