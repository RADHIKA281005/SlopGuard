SlopGuardSlopGuard for Git (specifically as a GitHub App / Git Integration) is an automated repository triage tool designed to protect open-source repositories and development teams from low-effort, machine-generated "AI slop".

Core Purpose & Value Proposition
Maintainers often spend hours triaging AI-generated pull requests, automated security scan spam, and formulaic issue reports that lack substance. SlopGuard acts as an automated quality wall for incoming contributions, ensuring maintainer time is spent reviewing meaningful code changes rather than noise.

Key Capabilities
Automated Scoring (0–100): Evaluates incoming Pull Requests and Issues against pattern-matching heuristics and optional LLM judges to compute a confidence score on whether a submission is AI-generated slop.

Provenance Tagging: Detects generator markers, system prompt fingerprints, leaked assistant phrasing (e.g., "As an AI...", "Certainly! Here is..."), and repetitive boilerplate.

Quarantine, Never Auto-Close: Operates on a human-in-the-loop philosophy. It tags suspicious submissions with a slop-quarantine label and leaves a review breakdown, but never auto-closes a PR or issue on its own.

Maintainer Slash-Commands: Allows repository maintainers to trigger explicit destructive actions (e.g., closing, blocking, or approving) via direct PR comment commands like /slop.

CI & Git Hook Integration: Can be wired as a pre-commit check or CI pipeline gate to evaluate commit quality, markdown documentation, or PR content before human review.

How It Works in a Git Workflow
Plaintext
Incoming PR / Issue (Webhook)
             │
             ▼
    Heuristics & Score Engine
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ Clean ]       [ Suspicious / AI Slop ]
   │                   │
 Pass to Review  Apply "slop-quarantine" Label + Comment Breakdown
                       │
                       ▼
                 Maintainer Review (/slop command to dismiss/close)
