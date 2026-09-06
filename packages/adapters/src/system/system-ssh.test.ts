import { describe, expect, it } from "vitest";

import { buildBaseSshArgs } from "./system-ssh";

const WINDOWS_CLOUDFLARED =
  '"C:\\Program Files (x86)\\cloudflared\\cloudflared.exe" access ssh --hostname %h';

describe("buildBaseSshArgs", () => {
  it("passes a quoted Windows ProxyCommand as one OpenSSH option value", () => {
    const args = buildBaseSshArgs(
      {
        host: "ssh.example.com",
        username: "arun",
        sshProxyCommand: WINDOWS_CLOUDFLARED,
      },
      "/tmp/openship-control.sock",
    );

    const optionIndex = args.indexOf("ProxyCommand=" + WINDOWS_CLOUDFLARED);
    expect(optionIndex).toBeGreaterThan(0);
    expect(args[optionIndex - 1]).toBe("-o");
    expect(args).not.toContain("Program");
    expect(args).not.toContain("Files");
  });

  it("keeps quoted extra SSH arguments compatible with the shared splitter", () => {
    const args = buildBaseSshArgs(
      {
        host: "ssh.example.com",
        sshArgs: '-o "UserKnownHostsFile=/tmp/known hosts" -o IPQoS=throughput',
      },
      "/tmp/openship-control.sock",
    );

    expect(args).toContain("UserKnownHostsFile=/tmp/known hosts");
    expect(args).toContain("IPQoS=throughput");
    expect(args).not.toContain("hosts\"");
  });
});
