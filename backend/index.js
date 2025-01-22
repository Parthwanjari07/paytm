const express = require("express");
const mainRouter = require("./routes/index");
const cors = require("cors");
const port = 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1", mainRouter);

// Start Server with Confirmation
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});