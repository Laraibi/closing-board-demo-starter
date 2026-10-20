import { createApp } from "./app.js";
import { createStore } from "./lib/store.js";
import { demoData } from "../scripts/seed.js";
import { scheduleDigest } from "./jobs/digest.js";

const store = createStore(demoData());
const port = Number(process.env.PORT || 3000);
createApp(store).listen(port, () => console.log(`API démo sur http://localhost:${port}`));
scheduleDigest(store);
