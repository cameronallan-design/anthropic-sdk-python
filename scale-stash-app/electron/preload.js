const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Kit CRUD
  getKits: () => ipcRenderer.invoke("kits:getAll"),
  saveKit: (kit) => ipcRenderer.invoke("kits:save", kit),
  deleteKit: (id) => ipcRenderer.invoke("kits:delete", id),
  bulkImport: (kits) => ipcRenderer.invoke("kits:bulkImport", kits),

  // Box art
  pickImage: () => ipcRenderer.invoke("image:pick"),

  // CSV
  exportCSV: (kits) => ipcRenderer.invoke("csv:export", kits),
  importCSV: () => ipcRenderer.invoke("csv:import"),

  // Shop search
  searchShop: (retailer, query) =>
    ipcRenderer.invoke("shop:search", { retailer, query }),
});
