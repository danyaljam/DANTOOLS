package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

//go:embed bundle
var appBundle embed.FS

var releaseVersion = "dev"

func main() {
	if len(os.Args) > 1 {
		arg := strings.ToLower(os.Args[1])
		switch arg {
		case "update", "--update", "-u":
			printUpdateGuide()
			return
		case "version", "--version", "-v":
			fmt.Printf("DAN Tools v%s\n", releaseVersion)
			return
		case "help", "--help", "-h":
			printHelp()
			return
		}
	}

	cacheDirectory, err := os.UserCacheDir()
	if err != nil {
		log.Fatal(err)
	}

	root := filepath.Join(cacheDirectory, "dtools", releaseVersion)
	if _, err := os.Stat(filepath.Join(root, ".installed")); os.IsNotExist(err) {
		if err := extractBundle(root); err != nil {
			log.Fatal(err)
		}
	}

	nodeBinary, err := findBundledNode(root)
	if err != nil {
		log.Printf("bundled runtime not found; falling back to system node: %v", err)
		nodeBinary, err = exec.LookPath("node")
		if err != nil {
			log.Fatal(err)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "4173"
	}
	appURL := fmt.Sprintf("http://127.0.0.1:%s", port)

	// Start local static server
	serveScript := filepath.Join(root, "scripts", "serve-local.mjs")
	serverCmd := exec.Command(nodeBinary, serveScript)
	serverCmd.Dir = root
	serverCmd.Stdout = os.Stdout
	serverCmd.Stderr = os.Stderr

	if err := serverCmd.Start(); err != nil {
		log.Fatalf("failed to start local server: %v", err)
	}

	// Ensure server process is terminated on exit
	defer func() {
		if serverCmd.Process != nil {
			_ = serverCmd.Process.Kill()
		}
	}()

	// Listen for OS interrupt signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigChan
		if serverCmd.Process != nil {
			_ = serverCmd.Process.Kill()
		}
		os.Exit(0)
	}()

	// Wait for local server to be ready
	waitForServerReady("127.0.0.1", port, 4*time.Second)

	// Launch dedicated window (Edge App mode -> Chrome App mode -> Default browser)
	appWindowCmd := launchAppWindow(appURL)

	if appWindowCmd != nil {
		// Wait for the desktop window to close
		_ = appWindowCmd.Wait()
	} else {
		// If opened in browser tab, wait for server
		_ = serverCmd.Wait()
	}
}

func printHelp() {
	fmt.Printf("DAN Tools (dtools) v%s\n", releaseVersion)
	fmt.Println("Private Client-Side Web Utility Suite for Windows, Mac & Linux\n")
	fmt.Println("Usage:")
	fmt.Println("  dtools.exe            Launch the desktop application window")
	fmt.Println("  dtools.exe update     Check update commands for existing installs")
	fmt.Println("  dtools.exe version    Display the current release version")
	fmt.Println("  dtools.exe help       Show this help message\n")
	fmt.Println("Environment Variables:")
	fmt.Println("  PORT=4173             Custom local TCP port (default: 4173)")
	fmt.Println("  OPEN_BROWSER=false    Run headless without opening a window")
}

func printUpdateGuide() {
	fmt.Printf("===================================================\n")
	fmt.Printf("           DAN Tools Update Guide (Current: v%s)\n", releaseVersion)
	fmt.Printf("===================================================\n\n")
	fmt.Println("To update an existing installation on Windows:\n")
	fmt.Println("1. If installed via WinGet:")
	fmt.Println("   winget upgrade --id DanyalJam.DTools --exact\n")
	fmt.Println("2. If using PowerShell Direct Updater:")
	fmt.Println("   irm https://raw.githubusercontent.com/danyaljam/DANTOOLS/main/scripts/update-windows.ps1 | iex\n")
	fmt.Println("3. If installed from Git Source:")
	fmt.Println("   git pull origin main && npm ci && npm run build\n")
	fmt.Println("4. Standalone Executable Download:")
	fmt.Println("   https://github.com/danyaljam/DANTOOLS/releases/latest\n")
}

func waitForServerReady(host, port string, timeout time.Duration) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, port), 200*time.Millisecond)
		if err == nil {
			_ = conn.Close()
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
}

func launchAppWindow(targetURL string) *exec.Cmd {
	if os.Getenv("OPEN_BROWSER") == "false" {
		return nil
	}

	// 1. Try Microsoft Edge in standalone app mode (native window without URL bar or tabs)
	edgePaths := []string{
		`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
		filepath.Join(os.Getenv("LOCALAPPDATA"), "Microsoft", "Edge", "Application", "msedge.exe"),
	}
	if p, err := exec.LookPath("msedge"); err == nil {
		edgePaths = append([]string{p}, edgePaths...)
	}

	for _, p := range edgePaths {
		if _, err := os.Stat(p); err == nil {
			cmd := exec.Command(p, fmt.Sprintf("--app=%s", targetURL), "--window-size=1366,860")
			if err := cmd.Start(); err == nil {
				return cmd
			}
		}
	}

	// 2. Try Google Chrome in standalone app mode
	chromePaths := []string{
		`C:\Program Files\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
		filepath.Join(os.Getenv("LOCALAPPDATA"), "Google", "Chrome", "Application", "chrome.exe"),
	}
	if p, err := exec.LookPath("chrome"); err == nil {
		chromePaths = append([]string{p}, chromePaths...)
	}

	for _, p := range chromePaths {
		if _, err := os.Stat(p); err == nil {
			cmd := exec.Command(p, fmt.Sprintf("--app=%s", targetURL), "--window-size=1366,860")
			if err := cmd.Start(); err == nil {
				return cmd
			}
		}
	}

	// 3. Fallback: Launch default browser via Windows start command
	cmd := exec.Command("cmd", "/c", "start", "", targetURL)
	_ = cmd.Start()
	return nil
}

func findBundledNode(root string) (string, error) {
	candidates := []string{
		filepath.Join(root, "runtime", "node.exe"),
		filepath.Join(root, "node.exe"),
		filepath.Join(root, "node", "node.exe"),
	}
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
	}
	return "", os.ErrNotExist
}

func extractBundle(root string) error {
	temporaryRoot := root + ".tmp"
	if err := os.RemoveAll(temporaryRoot); err != nil {
		return err
	}

	err := fs.WalkDir(appBundle, "bundle", func(sourcePath string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		relativePath := strings.TrimPrefix(strings.TrimPrefix(sourcePath, "bundle"), "/")
		if relativePath == "" {
			return nil
		}
		targetPath := filepath.Join(temporaryRoot, filepath.FromSlash(relativePath))
		if entry.IsDir() {
			return os.MkdirAll(targetPath, 0o755)
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
			return err
		}
		contents, err := appBundle.ReadFile(sourcePath)
		if err != nil {
			return err
		}
		return os.WriteFile(targetPath, contents, 0o644)
	})
	if err != nil {
		return err
	}

	if err := os.WriteFile(filepath.Join(temporaryRoot, ".installed"), []byte(releaseVersion), 0o644); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(root), 0o755); err != nil {
		return err
	}
	if err := os.RemoveAll(root); err != nil {
		return err
	}
	return os.Rename(temporaryRoot, root)
}