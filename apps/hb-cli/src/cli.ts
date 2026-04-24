#!/usr/bin/env node

import { main } from "./commands.js";

const exitCode = await main(process.argv.slice(2));
process.exit(exitCode);
