.PHONY: help release release-dev minify clean test install-deps

# Default target
help:
	@echo "CanvasFlow - Chrome Web Store Release Automation"
	@echo ""
	@echo "Available commands:"
	@echo "  make release       - Create minified release packages"
	@echo "  make release-dev   - Create unminified release (for debugging)"
	@echo "  make minify        - Minify JavaScript files only"
	@echo "  make test          - Verify extension structure"
	@echo "  make clean         - Remove build artifacts"
	@echo "  make install-deps  - Install Node.js dependencies"
	@echo ""
	@echo "Examples:"
	@echo "  make release                    # Release with current version"
	@echo "  VERSION=1.0.1 make release      # Release with specific version"

# Create release packages
release:
	@if [ -n "$(VERSION)" ]; then \
		./scripts/release.sh $(VERSION); \
	else \
		./scripts/release.sh; \
	fi

# Create unminified release packages (for debugging)
release-dev:
	@if [ -n "$(VERSION)" ]; then \
		./scripts/release.sh --no-minify $(VERSION); \
	else \
		./scripts/release.sh --no-minify; \
	fi

# Minify JavaScript files only
minify: install-deps
	@node scripts/minify.js

# Install Node.js dependencies
install-deps:
	@[ -d "node_modules" ] || npm install

# Test extension structure
test:
	@echo "Verifying extension structure..."
	@echo ""
	@echo "Checking manifest..."
	@if [ -f extension/manifest.json ]; then \
		echo "✓ manifest.json exists"; \
		cat extension/manifest.json | jq -r '.version' | xargs -I {} echo "  Version: {}"; \
	else \
		echo "✗ manifest.json not found"; \
		exit 1; \
	fi
	@echo ""
	@echo "Checking icons..."
	@for size in 16 48 128; do \
		if [ -f "extension/icon-$$size.png" ]; then \
			echo "✓ icon-$$size.png exists"; \
		else \
			echo "✗ icon-$$size.png missing"; \
		fi; \
	done
	@echo ""
	@echo "Checking CSP compliance..."
	@if grep -r "onclick\|onload\|onerror" extension/*.html > /dev/null 2>&1; then \
		echo "✗ Found inline event handlers (CSP violation)"; \
		grep -n "onclick\|onload\|onerror" extension/*.html; \
		exit 1; \
	else \
		echo "✓ No inline event handlers"; \
	fi
	@echo ""
	@echo "Checking for eval()..."
	@if grep -r "eval(" extension/*.js --exclude-dir=lib > /dev/null 2>&1; then \
		echo "⚠ Found eval() usage"; \
		grep -n "eval(" extension/*.js --exclude-dir=lib; \
	else \
		echo "✓ No eval() usage"; \
	fi
	@echo ""
	@echo "All checks passed!"

# Clean build artifacts
clean:
	@rm -rf dist/
	@rm -rf build/
	@rm -rf screenshots/*.png
