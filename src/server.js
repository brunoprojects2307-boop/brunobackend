const app = require("./app");
const config = require("./config");

app.listen(config.port, () => {
  console.log(`Admin backend running on http://localhost:${config.port}`);
});
