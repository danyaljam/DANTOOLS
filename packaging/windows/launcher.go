package main

import (
	"embed"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

//go:embed bundle
var appBundle embed.FS

var releaseVersion = "dev"

func main() {
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

	command := exec.Command(nodeBinary, filepath.Join(root, "scripts", "serve-local.mjs"))
	command.Dir = root
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	command.Stdin = os.Stdin
	if err := command.Run(); err != nil {
		log.Fatal(err)
	}
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