import "@aws-cdk/assert/jest";
import * as fs from "fs";
import { SynthUtils } from "@aws-cdk/assert";
import { IntegTesting } from "../src/sample/default.integration";

describe("default.Integration", () => {
  it("validates the default.integration file via a cloudformation stack", () => {
    fs.unlink("./test/__snapshots__/default.integration.snapshot.spec.ts.snap", (err) => {
      if (err) throw err;
    });
    const integ = new IntegTesting();
    integ.stack.forEach((stack) => {
      expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    });
  });
});
