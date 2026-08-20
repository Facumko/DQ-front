// Generar y almacenar device_id único por navegador
export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem("app_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("app_device_id", deviceId);
  }
  return deviceId;
};

// Obtener nombre del dispositivo/navegador
export const getDeviceName = () => {
  return navigator.userAgent || "Unknown Device";
};
