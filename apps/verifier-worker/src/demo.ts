import { runVerificationPipeline } from "./pipeline.js";

async function main(): Promise<void> {
  const result = await runVerificationPipeline({ seedDemoData: true });
  console.log(
    [
      `publications=${result.publications.length}`,
      `boards=${result.boardViews.length}`,
      `entries=${result.entryViews.length}`,
    ].join(" "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
