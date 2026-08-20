import { Phone, Siren, Flame, HeartPulse, Building2 } from "lucide-react";

export const LOCAL_EMERGENCY_NUMBERS = [
  {
    id: "911",
    label: "Emergencias",
    description: "Policía, bomberos y ambulancia",
    number: "911",
    display: "911",
    icon: Siren,
  },
  {
    id: "same",
    label: "SAME / Ambulancia",
    description: "Urgencias médicas",
    number: "107",
    display: "107",
    icon: HeartPulse,
  },
  {
    id: "bomberos",
    label: "Bomberos",
    description: "Incendios y rescate",
    number: "100",
    display: "100",
    icon: Flame,
  },
  {
    id: "policia",
    label: "Policía",
    description: "Comisarías de Sáenz Peña",
    number: "101",
    display: "101",
    icon: Phone,
  },
  {
    id: "hospital",
    label: "Hospital 4 de Junio",
    description: "Guardia — Av. Las Malvinas 1350",
    number: "3732420667",
    display: "(3732) 42-0667",
    icon: Building2,
  },
];