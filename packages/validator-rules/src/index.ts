import type { ValidationRule } from "@ohbp/validator-core";

import { bundleDigestFromChecksumsRule, traceRootHashRule } from "./rules/integrity.js";
import {
  publicPlusSealedRule,
  registrationAndSubjectBindingRule,
  traceCompletenessRule,
} from "./rules/semantics.js";
import { manifestRequiredFieldsRule } from "./rules/schema.js";

export function createDefaultRulePack(): ValidationRule[] {
  return [
    manifestRequiredFieldsRule,
    registrationAndSubjectBindingRule,
    publicPlusSealedRule,
    traceCompletenessRule,
    bundleDigestFromChecksumsRule,
    traceRootHashRule,
  ];
}

export {
  bundleDigestFromChecksumsRule,
  manifestRequiredFieldsRule,
  publicPlusSealedRule,
  registrationAndSubjectBindingRule,
  traceCompletenessRule,
  traceRootHashRule,
};
