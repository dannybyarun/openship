import { describe, expect, it } from "vitest";

import { buildBaseSshArgs, sshChildEnv } from "./system-ssh";

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

  it("omits Unix control sockets on Windows while preserving ProxyCommand", () => {
    const args = buildBaseSshArgs(
      {
        host: "ssh.example.com",
        username: "arun",
        sshProxyCommand: WINDOWS_CLOUDFLARED,
      },
      "C:\\\\Users\\\\arun\\\\AppData\\\\Local\\\\Temp\\\\openship-control.sock",
      undefined,
      "win32",
    );

    expect(args).not.toContain("ControlMaster=auto");
    expect(args.some((arg) => arg.startsWith("ControlPath="))).toBe(false);
    expect(args).toContain("ProxyCommand=" + WINDOWS_CLOUDFLARED);
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

describe("sshChildEnv", () => {
  it("prepends the bundled Cloudflare client directory on Windows", () => {
    const env = sshChildEnv(
      {
        host: "ssh.example.com",
        sshProxyCommand: "cloudflared access ssh --hostname %h",
      },
      "win32",
      {
        PATH: "C:\\Windows\\System32",
        OPENSHIP_CLOUDFLARED_PATH:
          "C:\\Openship\\resources\\cloudflared\\cloudflared.exe",
      },
    );

    expect(env.PATH?.split(";")[0]).toBe("C:\\Openship\\resources\\cloudflared");
  });

  it("does not alter PATH for non-Windows callers", () => {
    const env = sshChildEnv(
      {
        host: "ssh.example.com",
      },
      "linux",
      {
        PATH: "/usr/bin",
        OPENSHIP_CLOUDFLARED_PATH: "/opt/cloudflared/cloudflared",
      },
    );

    expect(env.PATH).toBe("/usr/bin");
  });
});
