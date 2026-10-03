# dtools

Private PDF, image, and document utilities that run locally in your browser. Files and inputs are not sent to a processing service.

Hosted web app: [https://danlabs.online](https://danlabs.online)

## One-command install

Requires Git and Node.js 22.13 or newer.

macOS / Linux:

```sh
git clone https://github.com/danyaljam/DANTOOLS.git dtools && cd dtools && npm ci && npm run build && npm run local
```

Windows PowerShell:

```powershell
git clone https://github.com/danyaljam/DANTOOLS.git dtools; if ($LASTEXITCODE -eq 0) { Set-Location dtools; npm ci; if ($LASTEXITCODE -eq 0) { npm run build; if ($LASTEXITCODE -eq 0) { npm run local } } }
```

Open `http://127.0.0.1:4173`. The server binds to this device only. Installation and the first build need internet access for packages; the built app works offline. Set `PORT` to use another local port.

## Restart the app

The local server runs only while its terminal session is open. If it stops, open a terminal in the app directory and start it again:

- Source install (macOS/Linux/Windows): `npm run local`
- Homebrew install (macOS/Linux): `dtools`
- Windows EXE install: run the downloaded `dtools-<version>.exe` again from PowerShell.

Then open `http://127.0.0.1:4173` again. Stop the server with Ctrl+C.

Package-manager installers:

- macOS/Linux, available now: `brew install danyaljam/tap/dtools`
- Windows, after [WinGet review](https://github.com/microsoft/winget-pkgs/pull/446164): `winget install --id DanyalJam.DTools --exact`

## One-command uninstall

Stop the local server with Ctrl+C before uninstalling.

For a source install, run from the directory containing the `dtools` folder:

- macOS/Linux: `rm -rf -- ./dtools`
- Windows PowerShell: `Remove-Item -LiteralPath .\dtools -Recurse -Force`

For a package-manager install:

- Homebrew: `brew uninstall dtools`
- WinGet: `winget uninstall --id DanyalJam.DTools --exact; if ($LASTEXITCODE -eq 0) { Remove-Item -LiteralPath "$env:LOCALAPPDATA\dtools" -Recurse -Force -ErrorAction SilentlyContinue }`

