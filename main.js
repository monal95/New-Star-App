const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Setup logging to file
const logPath = path.join(__dirname, "app.log");
const logStream = fs.createWriteStream(logPath, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  logStream.write(logMessage);
}

log("=== App Starting ===");

// Check if running in development mode (when package.json main is main.js and not from dist)
const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

log(`isDev: ${isDev}`);
log(`app.isPackaged: ${app.isPackaged}`);

let mainWindow;
let backendProcess;
let frontendServer;

// Simple HTTP server to serve frontend files
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, "frontend", "dist");

    if (!fs.existsSync(distPath)) {
      reject(new Error("Frontend dist folder not found: " + distPath));
      return;
    }

    const server = http.createServer((req, res) => {
      // Handle API proxy requests - forward to Express backend on localhost:5000
      if (req.url.startsWith("/api")) {
        const backendUrl = `http://localhost:5000${req.url}`;
        const clientReq = http.request(
          backendUrl,
          {
            method: req.method,
            headers: {
              ...req.headers,
              host: "localhost:5000",
            },
          },
          (clientRes) => {
            res.writeHead(clientRes.statusCode, clientRes.headers);
            clientRes.pipe(res);
          },
        );

        clientReq.on("error", (err) => {
          log("Backend proxy error: " + err.toString());
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Backend service unavailable" }));
        });

        if (req.method !== "GET" && req.method !== "HEAD") {
          req.pipe(clientReq);
        } else {
          clientReq.end();
        }
        return;
      }

      // Handle routing - always serve index.html for non-file requests
      let filePath = path.join(
        distPath,
        req.url === "/" ? "index.html" : req.url,
      );

      // Security: prevent directory traversal
      if (!filePath.startsWith(distPath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      // Try to serve the file
      fs.readFile(filePath, (err, data) => {
        if (err) {
          // If file not found and not index.html, try index.html (SPA routing)
          if (req.url !== "/" && !path.extname(req.url)) {
            fs.readFile(path.join(distPath, "index.html"), (err, data) => {
              if (err) {
                res.writeHead(404);
                res.end("Not found");
              } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(data);
              }
            });
          } else {
            res.writeHead(404);
            res.end("Not found");
          }
        } else {
          // Determine content type
          const ext = path.extname(filePath);
          let contentType = "text/plain";
          if (ext === ".html") contentType = "text/html; charset=utf-8";
          else if (ext === ".css") contentType = "text/css; charset=utf-8";
          else if (ext === ".js")
            contentType = "application/javascript; charset=utf-8";
          else if (ext === ".json")
            contentType = "application/json; charset=utf-8";
          else if (ext === ".png") contentType = "image/png";
          else if (ext === ".jpg" || ext === ".jpeg")
            contentType = "image/jpeg";
          else if (ext === ".svg") contentType = "image/svg+xml";
          else if (ext === ".woff") contentType = "font/woff";
          else if (ext === ".woff2") contentType = "font/woff2";
          else if (ext === ".ttf") contentType = "font/ttf";
          else if (ext === ".eot")
            contentType = "application/vnd.ms-fontobject";

          // Set cache control headers
          const cacheControl = ext === ".html" ? "no-cache" : "max-age=86400";
          const headers = {
            "Content-Type": contentType,
            "Cache-Control": cacheControl,
          };

          // Add CSP header for HTML files
          if (ext === ".html") {
            headers["Content-Security-Policy"] =
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http://localhost:3000 http://localhost:5000 http://127.0.0.1:3000 http://127.0.0.1:5000; frame-src 'self' data:;";
          }

          res.writeHead(200, headers);
          res.end(data);
        }
      });
    });

    server.listen(3000, "127.0.0.1", () => {
      log("Frontend server started on http://127.0.0.1:3000");
      frontendServer = server;
      resolve();
    });

    server.on("error", (err) => {
      log("Frontend server error: " + err.toString());
      reject(err);
    });
  });
}

// Function to create the main window
function createWindow() {
  log("Creating main window...");

  // Get screen dimensions to center the window
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;
  const windowWidth = 1200;
  const windowHeight = 800;
  const x = Math.max(0, Math.floor((screenWidth - windowWidth) / 2));
  const y = Math.max(0, Math.floor((screenHeight - windowHeight) / 2));

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "frontend", "public", "vite.svg"),
  });

  // Load the frontend from local HTTP server
  const startUrl = "http://127.0.0.1:3000";
  log("Loading URL: " + startUrl);

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.webContents.on("did-finish-load", () => {
    log("Page loaded successfully!");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Handle loading errors
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      log("Failed to load page: " + errorDescription);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show(); // Show window even if load failed
      }
    },
  );

  mainWindow.webContents.on("crashed", () => {
    log("Window crashed!");
  });

  // Open DevTools in development
  if (isDev) {
    log("Opening DevTools...");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    log("Window closed");
    mainWindow = null;
  });
}

// Function to start the backend server
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, "backend", "server.js");

    log("Starting backend server...");
    backendProcess = spawn("node", [backendPath], {
      stdio: "pipe", // Don't inherit stdio to avoid mixing output
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    // Capture backend output for debugging
    if (backendProcess.stdout) {
      backendProcess.stdout.on("data", (data) => {
        log("[Backend] " + data.toString().trim());
      });
    }
    if (backendProcess.stderr) {
      backendProcess.stderr.on("data", (data) => {
        log("[Backend Error] " + data.toString().trim());
      });
    }

    backendProcess.on("error", (error) => {
      log("Failed to start backend: " + error.toString());
      reject(error);
    });

    // Give backend time to start
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

// Handle app ready event
app.on("ready", async () => {
  try {
    // Start frontend server first
    log("Starting frontend HTTP server...");
    await startFrontendServer();

    // Start backend server
    log("Starting backend server...");
    await startBackend();

    // Create the browser window
    createWindow();

    // Create application menu
    createMenu();
  } catch (error) {
    log("App initialization failed: " + error.toString());
    app.quit();
  }
});

// Handle app window-all-closed event
app.on("window-all-closed", () => {
  // Close frontend server
  if (frontendServer) {
    log("Closing frontend server...");
    frontendServer.close();
  }

  // Kill backend process
  if (backendProcess) {
    log("Killing backend process...");
    backendProcess.kill("SIGTERM");
  }

  // Quit app (except on macOS where apps usually stay active)
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle app activate event (macOS)
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  log("Uncaught Exception: " + error.toString());
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            if (mainWindow) mainWindow.reload();
          },
        },
        {
          label: "Toggle Developer Tools",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
