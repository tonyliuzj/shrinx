const HOSTNAME_PATTERN =
  /^(localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|(?:\d{1,3}\.){3}\d{1,3})$/i;

function isValidIpv4(host) {
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return false;
  }

  return host.split(".").every((part) => {
    const value = Number(part);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

export function normalizeDomainInput(value) {
  return value.trim().toLowerCase();
}

export function validatePlainDomain(value) {
  const normalized = normalizeDomainInput(value || "");

  if (!normalized) {
    return {
      valid: false,
      normalized,
      error: "Domain is required.",
    };
  }

  if (/^https?:\/\//i.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        "Enter a plain domain like example.com or test.com:8080 without http:// or https://.",
    };
  }

  if (/[/?#]/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        "Enter only the domain and optional port. Do not include slashes, paths, queries, or fragments.",
    };
  }

  if (/\s/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Spaces are not allowed in a domain.",
    };
  }

  const parts = normalized.split(":");

  if (parts.length > 2) {
    return {
      valid: false,
      normalized,
      error: "Only a single optional port is allowed after the domain.",
    };
  }

  const [host, port] = parts;

  if (!HOSTNAME_PATTERN.test(host)) {
    return {
      valid: false,
      normalized,
      error:
        "Enter a valid plain domain like example.com, test.com:8080, or 123.domain.tld.",
    };
  }

  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) && !isValidIpv4(host)) {
    return {
      valid: false,
      normalized,
      error: "IPv4 addresses must use octets between 0 and 255.",
    };
  }

  if (port !== undefined) {
    if (!/^\d{1,5}$/.test(port)) {
      return {
        valid: false,
        normalized,
        error: "Port must be a number between 1 and 65535.",
      };
    }

    const portNumber = Number(port);
    if (portNumber < 1 || portNumber > 65535) {
      return {
        valid: false,
        normalized,
        error: "Port must be a number between 1 and 65535.",
      };
    }
  }

  return {
    valid: true,
    normalized,
    error: null,
  };
}
