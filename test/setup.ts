import dataGenerator from "../src/services/dataGeneratorService.js";

beforeEach(async function () {
  this.timeout(5000);
  await dataGenerator.generate();
});
