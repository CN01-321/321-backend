import express from "express";
import bodyParser from "body-parser";
import authRouter from "./routes/authRoute.js";
import ownerRouter from "./routes/ownerRoute.js";
import carerRouter from "./routes/carerRoute.js";
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.js";
import errorHandler from "./errors.js";
import petRouter from "./routes/petRoute.js";
import dataGenerator from "./services/dataGeneratorService.js";

dotenv.config();

const port = process.env.SERVER_PORT;
const app = express();

app.use(bodyParser.json());

app.get("/", (_, res) => {
  res.status(200).send("Hello world");
});

app.listen(port, () => console.log(`Running on port ${port}`));

app.use("/api/owners", ownerRouter);
app.use("/api/carers", carerRouter);
app.use("/api/users", userRouter);
app.use("/api/pets", petRouter);
app.use("/api", authRouter);

app.use(errorHandler);

if (process.env.POPULATE_DB === "true") {
  console.log("populating users");
  await dataGenerator.generate();
}
