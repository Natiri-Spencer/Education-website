# Launch features and remaining operator steps

Prepared 3 November 2026 for CBE STEM ACADEMY. The target is about 200 registered learners, with a supervised trial before expanding. This document records technical work separately from actions that require the owner, teachers, service accounts or Kenyan privacy review. No domain, business registration, paid server or external email account has been purchased.

## Implemented locally

- Public signup, staged age-band/recovery-email approval, guardian acknowledgement, expiring signed links, existing-account verification, password recovery and audited staff-assisted recovery.
- My Learning, selected grade, recent lessons and explicit self-reported completion. A page visit is not an assessed achievement.
- Account-scoped saving adapters for the whiteboard and Grade 7–9 notebook/reflection/drawing controllers; private online work and documents, offline queues, revision conflicts, explicit legacy import, export and quota controls.
- Administrator-approved teachers, grade-based class groups, membership approval, individual notebook/whiteboard submissions, immutable snapshots, versioned resubmissions and teacher feedback history. A submitted whiteboard contains only the selected board and its documents, never the learner's whole private library.
- Help, Support, Privacy, Terms, Guardian Information, deletion information and friendly error/maintenance pages. Ask AI controls, endpoints, provider settings and startup services are removed. Existing AI-labelled notes are preserved.
- Additive database migrations preserve existing accounts, password hashes, grades, resources, lessons and videos. A private pre-upgrade SQLite copy is in the ignored deployment-backups directory.
- Daily encrypted-backup and monthly isolated-restoration scripts/timers, backup/operations health endpoints, retention and launch-check commands, and a synthetic 20-session capacity check.

## Account operations

1. Local preview uses console email: approval/reset messages appear in server output, not a real inbox. On the deployed server, fill EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL, SUPPORT_EMAIL and PUBLIC_CONTACT_EMAIL privately. The owner has not supplied the final contact address yet.
2. Use Resend SMTP at smtp.resend.com:587 with TLS. Authenticate the sending domain using the provider's required DKIM/SPF records and publish an appropriate DMARC record. Disable open/click tracking in the provider account. Verify messages arrive in a real inbox and test recovery before opening registration.
3. The shared daily application allowance defaults to 90 messages, reserving headroom below a 100/day provider allowance. Resend's actual account limits and billing terms must be checked at setup. Onboarding 200 accounts may need to be spread across several days. Failed delivery keeps the request pending; the person can resend later. There is no hidden paid upgrade.
4. New under-18 requests initially contain only the recovery/guardian email and age band. The guardian explicitly approves before the learner chooses a username/password. Email control and self-attestation do not prove legal guardianship: staff need an established verification/dispute procedure, approved as part of the privacy review.
5. In Django admin, select approved teachers in Users and run **Approve selected users as teachers**. Then create Class Groups and assign those teachers. Teachers do not need is_staff or superuser status. They review membership requests and submissions at `/learning/teacher/`.
6. Staff recovery is available at `/accounts/staff-recovery/USER_ID/`, including links from class-membership lists for administrators. Record the identity-check method without document numbers or passwords. The learner must change the temporary password at next sign-in.
7. Review deletion requests in Profiles and through operations alerts. After verifying authority and retention obligations, run:

```sh
python manage.py learning_retention --approve-deletion USER_ID --authority-note "Established guardian/school contact and retention review completed"
```

This refuses staff accounts and accounts with protected historical enrollment records. Resolve those with an explicit retention decision rather than silently dropping them. The regular retention task removes signup requests older than seven days and reports deletion requests approaching 30 days. Private files are removed when their account/attachment records are deleted. Retain operational logs for no more than 30 days; keep consent/security audit retention documented separately.

## Privacy and scientific review before real public use

The operator must confirm the legal operator name/contact and review the public policy text. Record the actual countries and processing locations for OVHcloud, Resend and R2, applicable provider agreements and cross-border safeguards, the lawful purposes, guardian verification, deletion/retention, ODPC registration applicability and any required impact assessment. Public handwriting recognition is server processing; include it and optional browser-provider speech processing in the review. There is no advertising or behavioural analytics.

Use the [ODPC children’s-data guidance](https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-for-Processing-Childrens-Data.pdf) and obtain a qualified Kenyan review where needed. The implementation is not a regulatory certification. Domain or business-name registration does not replace these checks.

### Kenyan review record to complete before launch

- **Guardian authority and age:** the ODPC children's guidance calls for reasonable age and parent/guardian-consent verification. The email approval screen is one step only. The operator must approve a proportionate school/guardian verification and dispute procedure, record the method and policy version, and avoid retaining unnecessary identity documents. No real child accounts should be onboarded publicly until that procedure is approved.
- **Registration:** [ODPC's registration FAQ](https://www.odpc.go.ke/faqs/) lists provision of education among activities that do not receive the small-business registration exemption. Treat registration as a launch requirement and confirm the academy's controller/processor role with ODPC; a small learner count does not establish exemption. No application or certificate has been obtained by this implementation.
- **Overseas processing:** [ODPC's published data-protection principles](https://www.odpc.go.ke/rights-of-a-data-subject/) require a basis for transfers outside Kenya. Record each provider's actual storage/processing countries, contractual safeguards, access arrangements and the reviewed transfer basis before entering learner data. A provider's brand name alone does not establish its processing location.
- **Impact assessment:** use the [official ODPC guidance catalogue](https://www.odpc.go.ke/guidelines-2/) for the children's, education-sector and impact-assessment guidance. Have the reviewer document the children's-data risks and whether a formal assessment, submission or consultation is required, then complete any required steps before processing begins. This question remains open, rather than being marked exempt by default.

Record reviewer, date, conclusions, outstanding actions and evidence privately in the launch gate. These notes describe the review work required; they do not assert that statutory consent, registration or an assessment has already been completed.

[CONTENT_REVIEW.md](CONTENT_REVIEW.md) inventories the five curated video lessons, published Grade 7–9 course modules, practical templates and persistence adapters. Automated checks found the required video/audio/caption/poster/transcript/source files and VTT cues. A named teacher must still review the science, units, assessment answers, procedures, safety, captions/transcripts and attribution for every published item. Record corrections and actual approval; do not treat software tests as scientific sign-off.

## Encrypted backups and monthly restoration

Deploy the repository to `/opt/cbe-stem-academy`. Install Docker Compose, restic, bash, util-linux/flock and systemd on the Ubuntu server. Keep the PostgreSQL, media, private_work, runtime and certificate volumes persistent. Choose a private Cloudflare R2 bucket and a bucket-scoped credential. Do not enable a public bucket endpoint.

Create `/etc/cbe-backups.env` owned by root with mode 600, containing the following settings, filled privately:

```text
RESTIC_REPOSITORY=s3:https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/YOUR_PRIVATE_BUCKET
RESTIC_PASSWORD_FILE=/etc/cbe-restic-password
AWS_ACCESS_KEY_ID=YOUR_BUCKET_SCOPED_KEY
AWS_SECRET_ACCESS_KEY=YOUR_BUCKET_SCOPED_SECRET
AWS_DEFAULT_REGION=auto
```

Generate a strong separate restic password in `/etc/cbe-restic-password` (mode 600) and keep a recovery copy outside the server. Never store it only in the backup it decrypts. Initialise the restic repository once using these environment variables; do not run init repeatedly against an existing repository.

Install and enable the services/timers:

```sh
sudo cp deploy/cbe-backup.service deploy/cbe-backup.timer deploy/cbe-restore.service deploy/cbe-restore.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cbe-backup.timer cbe-restore.timer
sudo systemctl start cbe-backup.service
sudo systemctl start cbe-restore.service
```

Backups run at **02:00 Africa/Nairobi daily**. They briefly pause web writes, dump PostgreSQL, copy public/private files, record the code revision and model counts/file hashes, and encrypt the coordinated snapshot using restic. Thirty daily snapshots are retained. Cleanup releases the write pause after success or failure; systemd's stop hook provides an additional release after a timeout. Offline learning-work changes remain queued; other forms may need resubmitting. If the Docker daemon is unavailable, recovery waits until the daemon is restored; the website readiness monitor also detects that outage.

The monthly drill restores into the separate `cbe-restore-drill` Compose project. It publishes no ports, never starts its proxy and never replaces the production database. It checks model counts, snapshot integrity, restored public/private file hashes and references, and internal readiness. It removes only the drill project's volumes afterwards. Keep the code/image revision compatible with the snapshot. Failed drills mark operations health as needing attention.

Recovery target: one working day, with up to 24 hours of recent server changes potentially lost. Browser-only unsent work is not in a server backup. R2 free allowances are usage-dependent; monitor storage/operations and approve any spending change before relying on a larger allowance.

## Alerts and launch gate

Set UptimeRobot monitors on the actual HTTPS addresses:

- `/health/` — database/cache readiness.
- `/health/backups/` — last successful backup less than 26 hours old and no recorded backup failure.
- `/health/operations/` — disk usage below 80%, no overdue deletion review, a successful restoration drill within 35 days, and no unacknowledged application error.

Use five-minute checks and the owner's chosen alert email. Failure notifications contain operational status, not learner work. These monitors must be activated in the owner's account; creating endpoints alone does not enable notifications. After diagnosing and fixing a server error, acknowledge it with `python manage.py acknowledge_error --note "Incident reference and repair verified"`. The operational marker stores only a timestamp; it does not contain the request, learner work or reset link. A service outage can delay email: external monitoring must deliver through its own notification service.

Production public registration is closed by default. After real checks, write a private `/app/runtime/launch-approval.json` in the runtime volume, using dated notes/evidence rather than invented approvals:

```json
{
  "kenyan_privacy_review": "Reviewer/date/reference",
  "teacher_content_approval": "Teacher/date/inventory reference",
  "restore_test": "Date and verified drill result",
  "supervised_trial": "Two teachers, ten learners; date and resolved issues",
  "load_test_20_sessions": "Target-host report and date",
  "smtp_delivery_test": "Date and verified approval/reset email delivery"
}
```

Run `python manage.py check_learning_launch`. It checks configured email/contact values, production mode and recorded reviews; it does not independently certify the truth of an approval. Only then set `PUBLIC_REGISTRATION_ENABLED=True` and restart. Startup refuses an enabled public launch without this gate. Do not include the private gate, provider credentials or backup archives in GitHub or public media.

## Test and rollout evidence

Verified on 3 November 2026 against implementation commit `8bbec8c`:

- **132 Python tests and 180 JavaScript tests passed.** Local browser checks passed for sign-in, online saving/reload, private documents retrieved on another device, individual-board submissions, teacher feedback, phone layout and lab initialization. Separate browser checks preserved a 6 MB offline draft across reopening and resolved simultaneous-device revisions while downloading the losing copy.
- **[Linux deployment workflow passed](https://github.com/Natiri-Spencer/Education-website/actions/runs/41696301368):** production image build, PostgreSQL account-boundary tests, HTTPS readiness/pages, curated and uploaded video range requests, and 20 isolated synthetic learner sessions. All 20 completed with zero errors; p95 save/read/dashboard cycle was **0.54 seconds on the GitHub runner**. This is evidence for the test environment, not a performance guarantee for the eventual VPS or school connection.
- The same workflow passed deliberate backup-failure cleanup, encrypted restic backup and isolated PostgreSQL/public/private-file restoration, including record counts and file hashes. This used a local encrypted test repository; actual R2 access, off-server recovery and external alert delivery remain to be verified with the owner's provider accounts.

- Local tests cover signup/consent/recovery, legacy-account preservation, CSRF, request limits, learner separation, private downloads, quotas, revisions/tombstones, individual-board submission, teacher boundaries, assessment history, maintenance and deletion.
- Browser checks use a separate copied QA database and synthetic accounts. They cover sign-in, whiteboard/document saving, fresh-device document retrieval, notebook initialization, submission/feedback and phone layout. These are not a substitute for the supervised human trial.
- GitHub runs Python/JavaScript tests, builds the Linux image, validates Caddy, tests account boundaries on PostgreSQL, checks HTTPS/media seeking, and exercises encrypted backup/restoration in an isolated test repository. Production Resend delivery and R2 access still need real provider credentials.
- For capacity, `prepare_trial_users` works only with explicit test provisioning and localhost-only allowed hosts. `deploy/load_check.py` uses exactly 20 synthetic sessions, performs revisioned save/read/dashboard cycles, reports errors/p95 and deletes its own temporary work. Its acceptance target is zero errors and a p95 cycle below five seconds. Do not provision fake consent records in a real public deployment.
- Start the human trial with two teachers and ten learners. Test phone/desktop, keyboard and touch, captions/audio, recovery, offline/reconnection, shared computers, conflicts, class requests, selected submissions and feedback. Expand towards 200 registered learners only after issues are resolved and the target-host capacity check passes.

Still external: domain/business-name registration, hosting/provider accounts, final owner email, real email DNS/delivery, R2 credentials, Kenyan privacy review, named-teacher content approval and the supervised trial. These must not be described as already completed.
