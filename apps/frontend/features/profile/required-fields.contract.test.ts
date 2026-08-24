import { readFileSync } from "node:fs"
import { join } from "node:path"

import { PROFILE_FORM_FIELDS } from "@/features/profile/form-state"

/**
 * apps/frontend does not (and should not) depend on apps/backend, so this
 * reads the backend source as text instead of importing it. That is fragile
 * to a backend refactor (renamed constant, reformatted array literal) — see
 * Task 076 evidence / ROADMAP idea for extracting a shared package, which is
 * the real fix. This test is the stopgap until that lands.
 */
const POLICY_FILE_PATH = join(
  __dirname,
  "../../../backend/src/modules/profiles/profile-completion.policy.ts",
)

const EXPECTED_BACKEND_FIELD_COUNT = 8

/** Enforced by the backend but not editable in the frontend form (see form-state.ts). */
const FIELDS_NOT_ON_FRONTEND_FORM = new Set(["birthDate", "photo"])

function parseBackendCompletionFields(): string[] {
  const source = readFileSync(POLICY_FILE_PATH, "utf8")
  const match = source.match(
    /PROFILE_COMPLETION_FIELDS\s*=\s*\[([\s\S]*?)\]\s*as const/,
  )

  if (!match) {
    return []
  }

  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((entry) => entry[1])
}

describe("frontend required fields vs backend PROFILE_COMPLETION_FIELDS (Task 070 regression guard)", () => {
  const backendFields = parseBackendCompletionFields()

  it("parser sanity check: still finds the backend field list", () => {
    // A renamed constant or reformatted array makes the regexp above match
    // nothing. Without this check that would parse an empty list, which
    // would then fail the comparison below for the wrong reason (and could
    // in principle pass by accident) instead of failing loudly here.
    if (backendFields.length !== EXPECTED_BACKEND_FIELD_COUNT) {
      throw new Error(
        `Expected to parse ${EXPECTED_BACKEND_FIELD_COUNT} fields out of ` +
          `PROFILE_COMPLETION_FIELDS in ${POLICY_FILE_PATH}, but parsed ` +
          `${backendFields.length}: ${JSON.stringify(backendFields)}. ` +
          "The parsing regexp in required-fields.contract.test.ts is out of " +
          "date with the backend source format — update it there, this is " +
          "not a report of a real field-list drift.",
      )
    }
  })

  it("keeps the frontend required-field list in sync with the backend completion policy", () => {
    const frontendRequiredFields = new Set(
      PROFILE_FORM_FIELDS.filter((field) => field.required).map(
        (field) => field.completionField,
      ),
    )

    const backendFieldsEditableOnFrontend = new Set(
      backendFields.filter((field) => !FIELDS_NOT_ON_FRONTEND_FORM.has(field)),
    )

    expect(frontendRequiredFields).toEqual(backendFieldsEditableOnFrontend)
  })
})
