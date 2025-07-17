export function h(tagName, props = {}, children = []) {
  const element = document.createElement(tagName);
  if (typeof props === "text") {
    element.textContent = props;
  } else {
    for (const prop in props) {
      const value = props[prop];
      if (prop === "classes") {
        for (const cssClass of value)
          element.classList.add(cssClass);
        continue;
      }
      element[prop] = value;
    }
  }
  for (const child of children)
    element.appendChild(child);
  return element;
}

export function encodeBase64UrlSafe(num) {
  // Based on [RFC 4648 §5](https://datatracker.ietf.org/doc/html/rfc4648#section-5), we'll skip '=' for padding.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  if (num === 0) return alphabet[0];
  let result = "";
  let iterations = 0;
  const iterationLimit = 100000;
  while (num > 0) {
    if (iterations > iterationLimit)
      throw new Error('Exceeded iteration limit of ' + iterationLimit);
    const remainder = num % 64;
    result = alphabet[remainder] + result;
    num = Math.floor(num / 64);
    iterations++;
  }
  return result;
}

export function isUrlSafeBase64(text) {
  // No handling of padding etc.
  return /^[a-zA-Z0-9_-]+$/.test(text);
}
