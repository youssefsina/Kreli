const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const connectDB = require("./config/db");
require("./models");

const authRouter = require("./routes/auth.routes");
const categoriesRouter = require("./routes/categories.routes");
const materielsRouter = require("./routes/materiels.routes");
const locationsRouter = require("./routes/locations.routes");
const usersRouter = require("./routes/users.routes");
const conversationsRouter = require("./routes/conversations.routes");
const notificationsRouter = require("./routes/notifications.routes");
const paiementsRouter = require("./routes/paiements.routes");
const commissionRouter = require("./routes/commission.routes");
const litigesRouter = require("./routes/litiges.routes");
const uploadRouter = require("./routes/upload.routes");

const { startReminderCron } = require("./services/reminders.cron");
const { initSocket } = require("./socket");

const helmet = require('helmet')
const errorHandler = require('./middleware/errorHandler.middleware')

const app = express();
const server = http.createServer(app);


app.use(helmet({
  
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  
  contentSecurityPolicy: false,
}));


const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsOrigin(origin, callback) {
  
  if (!origin) return callback(null, true);
  
  if (allowedOrigins.includes(origin)) return callback(null, true);
  
  if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
    return callback(null, true);
  }
  callback(new Error(`CORS: origin ${origin} not allowed`));
}

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
});


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 2000,
  message: { message: "Trop de requأھtes, veuillez rأ©essayer plus tard" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Trop de tentatives, veuillez rأ©essayer plus tard" },
  standardHeaders: true,
  legacyHeaders: false,
});


app.use(globalLimiter);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/materiels", materielsRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/conversations", conversationsRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/paiements", paiementsRouter);
app.use("/api/v1/commission", commissionRouter);
app.use("/api/v1/litiges", litigesRouter);
app.use("/api/v1/upload", uploadRouter);

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", message: "Kreli API running âœ…", timestamp: new Date() });
});


const onlineUsers = initSocket(io);

app.set("io", io);
app.set("onlineUsers", onlineUsers);


app.use(errorHandler);


startReminderCron();


const PORT = process.env.PORT ?? 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`ًںڑ€ Kreli API on port ${PORT}`));
});
