# Codebase Memory MCP on Mac mini

Session learning: the Command Center repo is already indexed by `codebase-memory-mcp` on the Mac mini and can be used for architecture lookup even if Hermes native MCP tools are not currently registered in the running profile.

## Known binary

```bash
HOME=/Users/ichris codebase-memory-mcp --version
# 0.8.1 observed
```

Use `HOME=/Users/ichris` because Hermes profile shells may use the sandbox HOME and miss Mac-authenticated/user-local tools.

## Useful commands

List indexed projects:

```bash
HOME=/Users/ichris codebase-memory-mcp cli list_projects '{}'
```

Known Command Center project name observed:

```text
Volumes-Patriot-2TB-Dev-Test-.openclaw-workspace-Forge-Command-center
```

Get architecture summary:

```bash
HOME=/Users/ichris codebase-memory-mcp cli get_architecture \
  '{"project":"Volumes-Patriot-2TB-Dev-Test-.openclaw-workspace-Forge-Command-center"}'
```

Detect changes:

```bash
HOME=/Users/ichris codebase-memory-mcp cli detect_changes \
  '{"project":"Volumes-Patriot-2TB-Dev-Test-.openclaw-workspace-Forge-Command-center"}'
```

Index/re-index repository:

```bash
HOME=/Users/ichris codebase-memory-mcp cli index_repository \
  '{"repo_path":"/Volumes/Patriot 2TB/Dev Test/.openclaw/workspace/Forge-Command-center","force":false}'
```

Search code:

```bash
HOME=/Users/ichris codebase-memory-mcp cli search_code \
  '{"project":"Volumes-Patriot-2TB-Dev-Test-.openclaw-workspace-Forge-Command-center","pattern":"routingDecisions","limit":10}'
```

## Hermes native MCP note

The CLI working does not mean the tools are available as native Hermes MCP tools. To expose them as first-class Hermes tools, add an `mcp_servers` entry to the active profile config and restart Hermes. Do not edit bundled `native-mcp` skill for this repo-specific note; keep the detail here under `dispatch-delegate` because it supports FORGE Command Center orchestration.
