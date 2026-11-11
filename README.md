<div align="center">
  <img src="docs/assets/whatsapp-hd-logo.webp" width="220" alt="WhatsApp-HD icon" />
  <h1>Whatsapp-HD</h1>
  <p><strong>Interactive terminal dashboard and CLI for WhatsApp image/video Status.</strong></p>
  <p>Built for Termux on Android · Node.js · Baileys</p>

  <p>
    <a href="https://github.com/DamnSit/Whatsapp-HD/stargazers"><img src="https://img.shields.io/github/stars/DamnSit/Whatsapp-HD?style=for-the-badge&labelColor=0d1117" alt="GitHub stars" /></a>
    <a href="https://www.npmjs.com/package/whatsapp-hd"><img src="https://img.shields.io/npm/dt/whatsapp-hd?style=for-the-badge&label=Total%20Downloads&labelColor=0d1117" alt="Total npm package downloads" /></a>
    <a href="https://github.com/DamnSit/Whatsapp-HD/commits/main"><img src="https://img.shields.io/github/last-commit/DamnSit/Whatsapp-HD?style=for-the-badge&labelColor=0d1117" alt="Last commit" /></a>
  </p>

  <p>
    <a href="#install-and-launch"><b>Quick Start</b></a> •
    <a href="#dashboard-and-controls">Dashboard</a> •
    <a href="#pair-whatsapp">Pair WhatsApp</a> •
    <a href="#upload-and-caption-workflow">Upload Guide</a> •
    <a href="docs/validation.md">Validation</a> •
    <a href="docs/security-review.md">Security</a>
  </p>
</div>

<br />

The dashboard and CLI share the same Baileys publisher. Original media bytes remain the upload source; only image preview thumbnails are generated.

The interface, CLI help, application messages, and displayed dates use English.

## Install and launch

```sh
pkg update
pkg install nodejs-lts termux-api ffmpeg
npm install -g whatsapp-hd@latest
whatsapp-hd
```

Use Node.js 20 or newer. Install the **Termux:API Android companion application** from a compatible source matching your Termux installation. `pkg install termux-api` installs the command-line package, not the Android app. ZeroTermux builds may supply their own API integration; verify `termux-storage-get` opens Android DocumentsUI in your build.

FFmpeg is needed for WebP thumbnails and video decoding validation. Its package also supplies FFprobe for video resolution and average frame rate. It does not re-encode the uploaded source. JPEG/PNG decoding and their existing 32 px JPEG preview generation continue to use Jimp. No new npm or TUI dependency is required.

The global command is `whatsapp-hd`. Run `npm install -g whatsapp-hd@latest` to update it; your session stays in the application data directory described below.

To work from the source repository, use Node.js 24 LTS and npm 12.2.0. Older npm versions can loop while resolving the image dependency override during a source build.

```sh
pkg install git
git clone https://github.com/amiercassanova-21/Whatsapp-HD.git
cd Whatsapp-HD
npm install -g npm@12.2.0
npm ci
node index.js
```

## Dashboard and controls

Launching without arguments opens the dashboard, showing application version, connection, privacy mode, numeric Status Audience, validation, synchronization state, and last successful sync time. Opening the dashboard alone does not start pairing.

Menu: **Upload Media**, **Sync Status Audience**, **Connect | Reconnect**, **Account Management**, **Settings | Help**, **Exit**.

| Control | Action |
| --- | --- |
| Up / Down | Select an action |
| Enter | Open or confirm the selected action |
| Escape | Return to the previous screen |
| Page Up / Page Down | Scroll long details, confirmations, or Help |
| Q | Exit safely from menus or progress screens |
| Ctrl+C | Exit safely from any screen |

The display follows terminal resize events and updates changed rows. Exit restores raw input state, cursor visibility, wrapping, and the normal terminal screen. A very small terminal displays a resize prompt. Use the CLI when stdin/stdout are not interactive terminals.

The dashboard uses a dark canvas, mint highlights, a compact status panel and numbered actions. Screen and selection transitions are brief; ongoing operations show an animated spinner and an indeterminate activity bar. Animation stops when the screen is idle or the application exits. Set `WA_REDUCED_MOTION=1` for a static display or `NO_COLOR=1` to disable colors.

## Pair WhatsApp

Select **Connect | Reconnect**, or run:

```sh
whatsapp-hd --connect
```

**Important:** Android split-screen is recommended during pairing. Keep **Termux and WhatsApp open side by side** so the pairing code remains visible while you enter it in WhatsApp. The pairing prompt and CLI display this reminder.

Enter your WhatsApp number, then enter the displayed pairing code in the official app: **Settings → Linked devices → Link a device → Link with phone number**. Indonesian local `08…` pairing numbers are converted to `628…`. Wait for the connected message. `--connect` directly starts the connection flow and never recursively opens the dashboard.

The TUI uses a single-line **PHONE NUMBER** field: **Enter** continues, **Ctrl+U** clears and **Esc** cancels. Its pairing code stays centered in a highlighted **PAIRING CODE** panel until the connection succeeds or closes. The connection timeout starts after phone entry. See [validation notes](docs/validation.md) for the checks and remaining Termux validation.

## Upload and caption workflow

1. Choose **Upload Media** to select either an image or a video. Android's native document picker opens through `termux-storage-get`.
2. Select media. The application validates the copied file's content and type, then shows its temporary filename and media summary in the caption and confirmation screens: for example, `MP4 · 6.75 MB · 1920x1080 · 60FPS` or `JPEG · 2.40 MB · 4000x3000`. Values come from the selected file; video FPS uses the average frame rate and retains fractional rates such as `59.94FPS`. Images show their source resolution.
3. Enter a caption, save an empty caption, or skip it.
4. Review the confirmation. Optionally choose **Manual Recipients** and enter comma-separated international numbers. The confirmation clearly labels this override; **Use Synced Audience** removes it for this upload.
5. Use **Edit Caption**, **Clear Caption**, **Skip Caption**, or **Change Media** as needed. Editing returns to the same confirmation without selecting media again. Changing media retains the draft caption for further editing.
6. **Confirm Upload** calls the same application service and `publishStatus()` used by the CLI. The reviewed recipients are frozen for this request so a later synchronization event cannot silently replace them.
7. Read **Successful** when the upload request completes, or **Failed** with the error when it rejects, then return to the dashboard. Temporary copies are cleaned in `finally`, including cancellation, failure, and normal exit.

If an audience is unavailable, empty, or unsupported, use **Connect / Sync Audience** or an explicit manual override before uploading. A cached audience can be used after reviewing its warning; it is never labelled newly synchronized without a new privacy record.

### Caption editor

| Control | Action |
| --- | --- |
| Text or paste | Insert text at the caret |
| Arrow keys / Home / End | Move through the caption |
| Backspace / Delete | Remove a grapheme / the next grapheme |
| Enter | Save, including an empty caption |
| Ctrl+J | Insert a newline |
| Ctrl+U | Clear the entire caption |
| Escape | Skip/remove the caption |

Unicode, emoji, combining characters, intended spaces, and newlines are preserved. Bracketed paste is enabled so pasted newlines remain text instead of submitting the screen. Without bracketed paste, terminals may send pasted carriage returns as Enter; use Ctrl+J or a terminal with bracketed-paste support for multiline entry. Terminal escape/control commands are excluded from caption text. Q is ordinary text while editing; use Ctrl+C to exit.

There is no arbitrary caption length limit. Errors reported by Baileys are shown on the result screen. Empty and skipped captions produce no `caption` field. The existing conditional caption payload and sender fan-out remain intact.

### Media and native picker limitations

Supported: **JPEG, PNG, WebP, MP4, M4V**. Validation checks signatures, image/container completeness, ISO BMFF `ftyp` brands, image decoding, and video frame decoding. Empty files, unsupported formats, corrupt/truncated files, and CLI filename/content mismatches are rejected. Video decoding can take time for long files; it does not produce a replacement video.

`termux-storage-get` uses an unrestricted `*/*` picker. It copies the selected provider file into a unique application-owned temporary directory; it does not expose a `content://` URI or the provider's original filename. Therefore the UI explicitly shows a temporary name such as `selection.jpg`, derived from the detected format. The original provider filename/extension cannot be checked; filename mismatch checks apply whenever the filename is available, including CLI paths. The media type is detected from its contents so **Upload Media** accepts both images and videos. The user's original file is never deleted.

Termux:API 0.53.0 can return exit code 0 while DocumentsUI is still open. The TUI waits up to two minutes for a copy whose size and modification time have stopped changing for one second, then validates its contents. This API version does not report native cancellation to the command: after cancelling in Android, press **Esc** in the terminal to return to the dashboard. **Q / Ctrl+C** exits safely while waiting. Large or slow provider copies may exceed the timeout and need another attempt.

No Android file manager, Sharesheet bridge, or second uploader is included. `termux-setup-storage` may be useful for direct CLI access to shared storage; the system picker handles its own provider access.

## Status Audience accuracy

Baileys `settings.update` supplies the decoded `statusPrivacy` App State. Synchronization requests `regular_high` through `resyncAppState`. Parsing, normalization, deduplication, recipient resolution, and indicators are centralized in `src/status-audience.js`.

| State | Dashboard meaning |
| --- | --- |
| `12 CONTACTS` / `✓ VALID` | ALLOW_LIST with 12 unique valid synchronized recipient JIDs |
| `0 CONTACTS` / `! EMPTY AUDIENCE` | ALLOW_LIST with no usable recipients |
| `UNSUPPORTED MODE` / `! MANUAL RECIPIENTS REQUIRED` | Automatic expansion is unavailable; no invented zero count |
| `UNKNOWN` / `! SYNC REQUIRED` | No usable audience data |

The displayed count is **synchronized recipient JIDs**, not the total phone contact count or an independent verification of every selection in the official app. Invalid JIDs are excluded and their count is retained. Device-qualified JIDs are normalized and duplicates removed. The sender account is included separately by the existing publisher.

Automatic resolution supports only classic **Only share with… (`ALLOW_LIST`)**. My contacts, My contacts except…, Close Friends, and newer custom lists are not expanded. Use manual recipients intentionally when needed. The application never changes official WhatsApp privacy settings.

`status-audience.json` stores mode, normalized recipients, invalid count, and `updatedAt`. Cached data is labelled as cached until a new privacy record is received. Legacy caches without a timestamp show an unknown last sync. Failed syncs and successful resync calls that deliver no privacy record do not advance that timestamp. Re-save **Only share with…** in WhatsApp and sync again if necessary.

## Persistent sessions and account management

Default storage is independent of the launch directory:

```text
$XDG_DATA_HOME/whatsapp-hd/          # when XDG_DATA_HOME is set
~/.local/share/whatsapp-hd/          # otherwise
  auth_info/
  status-audience.json
```

| Variable | Override |
| --- | --- |
| `WA_DATA_DIR` | Base application directory |
| `WA_AUTH_DIR` | Authentication directory; takes precedence over the base |
| `WA_AUDIENCE_FILE` | Audience file; takes precedence over the base |

Use absolute override paths when you need working-directory independence. Sensitive directories/files use restricted permissions where supported. Credentials and recipient data must remain private.

With default paths, if no destination authentication directory exists, initialization finds a legacy `auth_info/creds.json` in the launch directory or repository, copies the session and associated audience cache once, and reports the migration. It leaves the original files untouched and never overwrites destination credentials. Multiple distinct legacy sessions require explicit overrides. Setting any WA storage override opts out of automatic migration. If migration is interrupted, retain both locations and explicitly select the known-good original with `WA_AUTH_DIR` and `WA_AUDIENCE_FILE`; do not delete/reset credentials to troubleshoot.

A private `.legacy-session-migrated` marker records migration in the application data directory. Successful logout also records this marker, so restarting cannot silently import the preserved legacy credentials again.

**Exit** closes the local process and retains credentials/cache. It never invokes WhatsApp logout.

**Account Management → Logout WhatsApp → Confirm Logout** calls Baileys' supported remote logout. Only its successful return or an explicit logged-out event permits local credential/cache removal. A network failure preserves local files. Reconnect timers are cancelled, handlers detached, and pending writes drained before removal. Reconnecting after logout requires pairing again. The confirmation defaults to Cancel.

## Existing CLI

```sh
whatsapp-hd --help
whatsapp-hd --connect
whatsapp-hd --sync-audience
whatsapp-hd --upload "/storage/emulated/0/Pictures/status.jpg"
whatsapp-hd --upload "/storage/emulated/0/Download/video.mp4" --caption "Hello"
whatsapp-hd --upload "/path/status.jpg" --to "628123456789,628987654321"
whatsapp-hd --upload "/path/status.png" --caption "" --trace
```

`--upload`, `--caption`, `--to`, `--sync-audience`, `--trace`, `--help` remain available. `--sync-audience` and upload commands finish and close the local connection. `--connect` keeps the connection running until you exit. CLI recipient parsing retains its existing behavior; use international digits for manual recipients.

Normal logs remain concise; `--trace` enables Baileys diagnostics. Traces can contain sensitive metadata—review/redact before sharing. Known sensitive Signal session console dumps remain filtered.

**A successful `sendMessage()` return or Message ID is not proof of publication. Verify My Status and visibility with selected recipients.** Original source uploads and the normalized sender inclusion remain unchanged, but WhatsApp may process media server-side.

## Troubleshooting

- Picker command unavailable: install `termux-api` and the compatible Android companion, then retry. For a picker that does not open, check API integration, Android permissions, and app installation source. Q/Ctrl+C cancels the local action.
- FFmpeg missing: `pkg install ffmpeg`. WebP and video validation require it; JPEG/PNG can still be selected without it.
- Unsupported/empty audience: choose classic Only share with… in WhatsApp, save it, and sync; or review a manual override.
- Stale audience after sync: no new privacy record arrived. The old count and timestamp remain labelled cached.
- Session disconnected: try Connect, inspect the network, and check Linked devices. Do not erase credentials to fix Status visibility.
- Layout too small: enlarge the terminal, reduce font size, or scroll details with Page Up/Page Down.
- Interrupted upload: check My Status before retrying to avoid duplicate submissions.

## Development and validation

```sh
npm run check
npm test
npm audit
node index.js --help
```

With FFmpeg installed, `node scripts/validate-media.js` also checks real synthetic JPEG, PNG, WebP, MP4 and M4V files, original-byte preservation, captions and truncation rejection without connecting to WhatsApp.

The cross-platform syntax check covers nested source modules, scripts, and tests. Unit tests mock Android and Baileys and require no WhatsApp account. They cover media validation, picker cleanup, Unicode captions, publisher fan-out, audience states, storage migration, logout failure/races, terminal restoration, and upload navigation.

The implementation is separated into `src/tui/`, `src/android/`, `src/storage/`, and `src/account/`; the shared client lives in `src/whatsapp-client.js`. `src/status-publisher.js` remains the sole publishing implementation.

The npm package includes the executable, runtime modules, README and validation notes. The JavaScript-only Jimp dependency tree is bundled with the tested Zod fix because dependency overrides from this repository do not apply when another project installs the package. npm installs the remaining dependencies automatically. Source tests and local validation artifacts stay in the repository/workspace. See [on-device validation](docs/validation.md) for the tested environment and remaining live-account checks.

Version 1.0.2 enforces cryptographic signature checks for pairing/Noise and outgoing Signal signed pre-keys. It also aligns the bundled Jimp dependency declarations with the included Zod 4.6.7. Peer identity-key changes still follow Baileys' automatic trust policy. See the [security review](docs/security-review.md) for the reproduced failures, protections, Socket CVE status and validation limits.

Build a release archive with `npm run pack:release -- /absolute/output/directory`. The build stages the runtime files and bundled dependencies, removes the source-only override declaration from the staged manifest, and packs that verified graph. npm rejects packing a bundle while its source override is still declared. Test and publish the resulting `.tgz` archive.

## License and attribution

Copyright (C) 2026 **XurXuo (DamnSit)**. The original project code is dual-licensed under **GNU GPLv3 only OR GNU AGPLv3 only** (`GPL-3.0-only OR AGPL-3.0-only`). You may choose either license. See [LICENSE](LICENSE), [GPLv3 terms](LICENSE-GPL-3.0.txt), [AGPLv3 terms](LICENSE-AGPL-3.0.txt) and [NOTICE](NOTICE).

When distributing copies or modified versions, preserve the applicable original copyright and license notices, including the author's name in those notices. Modified versions must identify their changes and dates and comply with the source-code and licensing requirements of the license you choose. These notice-preservation obligations concern redistribution; they do not impose a blanket ban on editing every name or UI credit. Third-party dependencies retain their own licenses and notices.

If you choose AGPLv3 and modify the program, section 13 requires offering the corresponding source to users who interact with that modified version remotely over a network, when applicable. Users choosing GPLv3 are not subject to this additional AGPL requirement.

This program is provided without warranty as set out in the chosen license.

github awal → https://github.com/DamnSit/Whatsapp-HD
