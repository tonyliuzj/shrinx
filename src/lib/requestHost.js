const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function isValidIpv4(hostname) {
  if (!IPV4_PATTERN.test(hostname)) {
    return false;
  }

  return hostname.split(".").every((part) => {
    const value = Number(part);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function isValidIpv6(hostname) {
  if (!hostname.includes(":") || !/^[0-9a-f:.]+$/i.test(hostname)) {
    return false;
  }

  const compressedGroups = hostname.match(/::/g) || [];
  if (compressedGroups.length > 1) {
    return false;
  }

  const hasCompression = compressedGroups.length === 1;
  const groups = hostname.split("::").join(":").split(":").filter(Boolean);

  if (hasCompression) {
    if (groups.length >= 8) {
      return false;
    }
  } else if (groups.length !== 8) {
    return false;
  }

  return groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group));
}

export function normalizeHostHeader(hostHeader = "") {
  const value = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

export function getHostnameFromHostHeader(hostHeader = "") {
  const normalized = normalizeHostHeader(hostHeader);

  if (normalized.startsWith("[")) {
    const closingBracket = normalized.indexOf("]");
    return closingBracket === -1
      ? normalized.slice(1)
      : normalized.slice(1, closingBracket);
  }

  return normalized.split(":")[0];
}

export function isIpAddressHost(hostHeader = "") {
  const hostname = getHostnameFromHostHeader(hostHeader);

  return isValidIpv4(hostname) || isValidIpv6(hostname);
}

export function isPrimaryDomainRequest(requestHost = "", primaryDomain = "") {
  const normalizedRequestHost = normalizeHostHeader(requestHost);
  const normalizedPrimaryDomain = normalizeHostHeader(primaryDomain);

  if (!normalizedRequestHost || !normalizedPrimaryDomain) {
    return false;
  }

  return (
    normalizedRequestHost === normalizedPrimaryDomain ||
    normalizedRequestHost.startsWith(`${normalizedPrimaryDomain}:`)
  );
}

export function shouldRedirectToPrimaryDomain(requestHost = "", primaryDomain = "") {
  const normalizedRequestHost = normalizeHostHeader(requestHost);
  const normalizedPrimaryDomain = normalizeHostHeader(primaryDomain);

  if (!normalizedRequestHost || !normalizedPrimaryDomain) {
    return false;
  }

  return (
    !isIpAddressHost(normalizedRequestHost) &&
    !isPrimaryDomainRequest(normalizedRequestHost, normalizedPrimaryDomain)
  );
}

export function getRedirectDomainCandidates(requestHost = "", primaryDomain = "") {
  const normalizedRequestHost = normalizeHostHeader(requestHost);
  const requestHostname = getHostnameFromHostHeader(normalizedRequestHost);
  const candidates = [normalizedRequestHost, requestHostname];

  if (isIpAddressHost(normalizedRequestHost)) {
    const normalizedPrimaryDomain = normalizeHostHeader(primaryDomain);
    const primaryHostname = getHostnameFromHostHeader(normalizedPrimaryDomain);

    candidates.push(normalizedPrimaryDomain, primaryHostname);
  }

  return [...new Set(candidates.filter(Boolean))];
}
