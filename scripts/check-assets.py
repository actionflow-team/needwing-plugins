#!/usr/bin/env python3
"""Verify bundled clients and generated plugin assets against their source checkouts."""
import argparse
import json
from pathlib import Path
import re


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("homepage_root", type=Path)
    parser.add_argument("service_root", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]

    served = (args.homepage_root / "apps/portal/public/api/connect/client.py").read_bytes()
    for bundled in ("plugins/needwing/skills/needwing/client.py", "gemini-extension/client.py"):
        if (root / bundled).read_bytes() != served:
            parser.exit(1, f"{bundled} differs from the served client\n")

    generated = args.service_root / "deploy/generated/connect/plugins"
    assets = sorted(path for path in generated.rglob("*") if path.is_file())
    if not assets:
        parser.exit(1, "Generate the service's plugin assets first\n")
    for source in assets:
        relative = source.relative_to(generated)
        bundled = Path("plugins") / relative if relative.parts[0] == "needwing" else relative
        if relative in (Path("needwing/.mcp.json"), Path("needwing/mcp.json")):
            # Preserve the host-specific transport declarations while using the generated URL.
            expected = json.loads(source.read_text(encoding="utf-8"))
            if relative.name == ".mcp.json":
                expected["mcpServers"]["needwing"]["type"] = "http"
            else:
                expected["$schema"] = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"
                expected["mcpServers"]["needwing"]["type"] = "streamable-http"
            matches = json.loads((root / bundled).read_text(encoding="utf-8")) == expected
        else:
            matches = (root / bundled).read_bytes() == source.read_bytes()
        if not matches:
            parser.exit(1, f"{bundled} differs from the generated asset\n")

    versions = (args.service_root / "packages/contracts/src/client-version.ts").read_text(encoding="utf-8")
    plugin = re.search(r'^export const PLUGIN_VERSION = "(\d+\.\d+\.\d+)";$', versions, re.MULTILINE)
    if plugin is None:
        parser.exit(1, "Could not locate PLUGIN_VERSION in the service contracts\n")
    claude = json.loads((root / ".claude-plugin/marketplace.json").read_text(encoding="utf-8"))
    codex = json.loads((root / ".agents/plugins/marketplace.json").read_text(encoding="utf-8"))
    if claude["name"] != codex["name"]:
        parser.exit(1, "Claude and Codex use different marketplace names\n")
    if claude["plugins"][0]["version"] != plugin[1]:
        parser.exit(1, "Marketplace version differs from PLUGIN_VERSION\n")
    for manifest_path in (
        "server.json",
        "gemini-extension/gemini-extension.json",
        "plugins/needwing/plugin.json",
        "plugins/needwing/.claude-plugin/plugin.json",
        "plugins/needwing/.codex-plugin/plugin.json",
        "plugins/needwing/.cursor-plugin/plugin.json",
    ):
        manifest = json.loads((root / manifest_path).read_text(encoding="utf-8"))
        if manifest.get("version") != plugin[1]:
            parser.exit(1, f"{manifest_path} version differs from PLUGIN_VERSION\n")
    print("Plugin assets match the served client and generated service files.")


if __name__ == "__main__":
    main()
