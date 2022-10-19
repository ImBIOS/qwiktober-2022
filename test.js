import test from "ava";
import axios from "axios";
import * as tsImport from "ts-import";

test("custom contributor data validation", async (t) => {
  const response = await axios.get(
    "https://api.github.com/repos/ImBIOS/qwiktober-2022/contributors"
  );

  const github = await response.data.map((github) => github.login);

  const localData = contributors().default.map((item) => item.githubUsername);

  const validateContributor = getDifference(localData, github);

  // Check if the contributor data is the same as the one from GitHub
  t.true(
    validateContributor.length === 0,
    `Contributor data is not valid: ${validateContributor}`
  );
});

const contributors = () => {
  const filePath = `src/data/contributors.ts`;
  const syncResult = tsImport.loadSync(filePath);
  return syncResult;
};

const getDifference = (array1, array2) =>
  array1.filter((object1) => !array2.some((object2) => object1 === object2));
