import {
  GAME_CORE_VERIFICATION_COVERAGE_POLICY,
  GAME_CORE_REQUIRED_VERIFY_SCRIPT_NAMES,
  GAME_CORE_REQUIRED_VERIFY_SCRIPT_FILES,
} from "./gameCoreVerificationCoverageContract.js";

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

export function verifyGameCoreContractCoverage({ packageJson, existingScriptFiles }) {
  const issues = [];
  const scripts = packageJson?.scripts || {};
  const verifyScriptNames = Object.keys(scripts)
    .filter((name) => name.startsWith("verify:"))
    .sort();
  const buildScript = scripts.build || "";

  const missingScriptNames = GAME_CORE_REQUIRED_VERIFY_SCRIPT_NAMES.filter((name) => !(name in scripts));
  pushListIssue(issues, "missing verify scripts in package.json", missingScriptNames);

  const unexpectedVerifyScripts = verifyScriptNames.filter(
    (name) => !GAME_CORE_REQUIRED_VERIFY_SCRIPT_NAMES.includes(name),
  );
  pushListIssue(issues, "unexpected verify scripts in package.json", unexpectedVerifyScripts);

  const missingBuildCoverage = GAME_CORE_REQUIRED_VERIFY_SCRIPT_NAMES.filter(
    (name) => name !== "verify:contract-coverage" && !buildScript.includes(`npm run ${name}`),
  );
  pushListIssue(issues, "missing verify build coverage", missingBuildCoverage);

  if (!buildScript.includes("npm run verify:contract-coverage")) {
    issues.push("build script is missing verify:contract-coverage");
  }

  const missingScriptFiles = GAME_CORE_REQUIRED_VERIFY_SCRIPT_FILES.filter(
    (filePath) => !existingScriptFiles.includes(filePath),
  );
  pushListIssue(issues, "missing verify script files", missingScriptFiles);

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_VERIFICATION_COVERAGE_POLICY.owner,
      verifyScripts: GAME_CORE_REQUIRED_VERIFY_SCRIPT_NAMES.length,
      verifyFiles: GAME_CORE_REQUIRED_VERIFY_SCRIPT_FILES.length,
    },
  };
}

export function formatGameCoreContractCoverageVerification(result) {
  if (result.ok) {
    return [
      "gameCore contract coverage verification: OK",
      `- owner: ${result.counts.owner}`,
      `- verify scripts: ${result.counts.verifyScripts}`,
      `- verify files: ${result.counts.verifyFiles}`,
    ].join("\n");
  }

  return [
    "gameCore contract coverage verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreContractCoverage(ctx) {
  const result = verifyGameCoreContractCoverage(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreContractCoverageVerification(result));
  }
  return result;
}
