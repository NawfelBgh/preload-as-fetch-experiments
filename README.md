# Preload As Fetch Experiments

This repo contains Node.js servers with 2 experiments to test when a `fetch()` will reuse `<link rel="preload" as="fetch">` 
preloaded data, in various browsers, and for different option combinations.

With [Preload Reuse Experiment 1](#preload-reuse-experiment-1), you can test many possible combinations for the 
fetched URL's origin, `<link>` `crossorigin` attribute, `fetch` `mode` and `fetch` `credentials`. The test results matrix 
for Chrome, Firefox and Safari is provided.

[Preload Reuse Experiment 2](#preload-reuse-experiment-2) tests whether browsers reuse preloaded data when handling 
a `fetch()` with custom headers.

---

## Prerequisites

### Prerequisite 1: Set up hostnames `api.local` and `html.local`

Configure 2 hostnames: one for the main app server (`html.local`) and another one for the api server (`api.local`).
This is needed because Firefox treats all localhost/127.0.0.1 as same-origin regardless of port.
So we need to use different hostnames to test cross-origin behavior.

Add to `/etc/hosts`:

```
127.0.0.1 api.local
127.0.0.1 html.local
```

### Prerequisite 2: Generate HTTPS certificates

Generate HTTPS certificates for `api.local` and `html.local`.
   - You can use `openssl` to generate certificates, manually import the generated certificates into your system
   and click "Accept Risk and Proceed" when asked by the browser (Option A)
   - Or you can use [mkcert](https://github.com/FiloSottile/mkcert) which installs a local trusted certificate authority in your system (Option B)

#### Option A: Using `openssl`

Execute the commands:

```sh
mkdir .certs
cd .certs
# Generate the certificate and private key pair for api.local
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365
# For Common Name (CN), use api.local

# Rename the created files
mv key.pem api.local-key.pem
mv cert.pem api.local.pem

# Generate the certificate and private key pair for html.local
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365
# For Common Name (CN), use html.local

# Rename the created files
mv key.pem html.local-key.pem
mv cert.pem html.local.pem
```

And then, open the generated certificates `.certs/api.local.pem` and `.certs/html.local.pem` and import them into your system.

#### Option B: Using `mkcert`

Install `mkcert` by following the instructions from [their repo](https://github.com/FiloSottile/mkcert),
and then execute the commands:

```sh
mkdir .certs
cd .certs

mkcert html.local
mkcert api.local
```

### Prerequisite 3: Run the servers

Run the servers for the experiments.

For [Preload Reuse Experiment 1](#preload-reuse-experiment-1), run:

```sh
node preload-fetch-combo-html/index.js & node preload-fetch-combo-api/index.js
```

For [Preload Reuse Experiment 2](#preload-reuse-experiment-2), run:

```sh
node preload-fetch-with-headers-html/index.js & node preload-fetch-with-headers-api/index.js
```

### Prerequisite 4: Set up cookies

Navigate to pages:

- [https://html.local:3016/](https://html.local:3016/) and [https://api.local:3017/](https://api.local:3017/), for experiment 1.
- [https://html.local:3020/](https://html.local:3020/) and [https://api.local:3021/](https://api.local:3021/), for experiment 2.

Set up the cookies in all domains by executing the following JavaScript code on the browser's console:

```javascript
document.cookie = 'name=value; SameSite=None;Secure'
```

Firefox and Safari can block the sending of cookies in cross-origin requests. You can disable this behavior:

- In Firefox, temporarily disable or set exceptions for "Enhanced Tracking Protection".
- In Safari, go to Settings then Privacy and uncheck "Prevent cross-site tracking".

---

## Tested browsers

This document shows test results from the following browsers, on a macOS computer:

- Firefox Developer 151.0b10
- Chrome 148.0.7778.168
- Safari 26.4 (21624.1.16.11.4)

---

## Preload Reuse Experiment 1

In this experiment, we test all of the following possible combinations:

- Preloaded and fetched URL:
   - same-origin
   - cross-origin
- `<link>` `crossorigin` attribute:
   - (none)
   - use-credentials
   - anonymous
- `fetch` `mode`:
   - cors
   - no-cors
   - same-origin
- `fetch` `credentials`:
   - same-origin (default)
   - include
   - omit

To run the servers for this experiment:

```sh
node preload-fetch-combo-html/index.js & node preload-fetch-combo-api/index.js
```

Source code: [`preload-fetch-combo-html/index.js`](preload-fetch-combo-html/index.js) and 
[`preload-fetch-combo-api/index.js`](preload-fetch-combo-api/index.js).

You can run the experiment yourself by visiting [https://html.local:3016/](https://html.local:3016/), setting the options to test 
and then checking the network tab in the browser dev tools and the server logs.

The following table shows the experiment's test results.
The columns `URL Origin`, `Preload crossorigin`, `Fetch mode` and `Fetch credentials` are the inputs, 
while the remaining columns show the observed behavior.

| URL Origin   | Preload crossorigin   | Preload Sec-Fetch-Mode? | Preload sends cookie? | Fetch mode   | Fetch credentials  | Fetch sends cookie?   | Fetch response type?  | Preload Reused? (Firefox)| Preload Reused? (Chrome) | Preload Reused? (Safari) |
| ------------ | --------------------- | ----------------------- | --------------------- | ------------ | ------------------ | --------------------- | --------------------- | ------------------------ | ------------------------ | ------------------------ |
| Same         | (none)                | no-cors                 | Yes                   | no-cors      | (default)          | Yes                   | basic                 | ✅ Yes                   | ⚠️ No (same cookie&cors) | ✅ Yes                   |
| Same         | (none)                | no-cors                 | Yes                   | no-cors      | include            | Yes                   | basic                 | ✅ Yes                   | ✅ Yes                   | ✅ Yes                   |
| Same         | (none)                | no-cors                 | Yes                   | no-cors      | omit               | No                    | basic                 | ⚠️ Yes (different cookie)| ❌ No                    | ❌ No                    |
| Same         | (none)                | no-cors                 | Yes                   | cors         | (default)          | Yes                   | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | (none)                | no-cors                 | Yes                   | cors         | include            | Yes                   | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | (none)                | no-cors                 | Yes                   | cors         | omit               | No                    | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | use-credentials       | cors                    | Yes                   | no-cors      | (default)          | Yes                   | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | use-credentials       | cors                    | Yes                   | no-cors      | include            | Yes                   | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | use-credentials       | cors                    | Yes                   | no-cors      | omit               | No                    | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | use-credentials       | cors                    | Yes                   | cors         | (default)          | Yes                   | basic                 | ⚠️ No (same cookie&cors) | ⚠️ No (same cookie&cors) | ⚠️ No (same cookie&cors) |
| Same         | use-credentials       | cors                    | Yes                   | cors         | include            | Yes                   | basic                 | ✅ Yes                   | ✅ Yes                   | ⚠️ No (same cookie&cors) |
| Same         | use-credentials       | cors                    | Yes                   | cors         | omit               | No                    | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | anonymous             | cors                    | (!) Yes               | no-cors      | (default)          | Yes                   | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | anonymous             | cors                    | (!) Yes               | no-cors      | include            | Yes                   | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | anonymous             | cors                    | (!) Yes               | no-cors      | omit               | No                    | basic                 | ❌ No                    | ❌ No                    | ❌ No                    |
| Same         | anonymous             | cors                    | (!) Yes               | cors         | (default)          | Yes                   | basic                 | ✅ Yes                   | ✅ Yes                   | ⚠️ No (same cookie&cors) |
| Same         | anonymous             | cors                    | (!) Yes               | cors         | include            | Yes                   | basic                 | ⚠️ No (anon.+cred.incl.) | ⚠️ No (anon.+cred.incl.) | ⚠️ No (anon.+cred.incl.) |
| Same         | anonymous             | cors                    | (!) Yes               | cors         | omit               | No                    | basic                 | ⚠️ Yes (different cookie)| ❌ No                    | ❌ No                    |
| Different    | (none)                | no-cors                 | (!) Yes               | no-cors      | (default)          | No                    | opaque                | ⚠️ Yes (different cookie)| ❌ No                    | ❌ No                    |
| Different    | (none)                | no-cors                 | (!) Yes               | no-cors      | include            | Yes                   | opaque                | ⚠️ Yes (although opaque) | ⚠️ Yes (although opaque) | ❌ No                    |
| Different    | (none)                | no-cors                 | (!) Yes               | no-cors      | omit               | No                    | opaque                | ⚠️ Yes (different cookie)| ❌ No                    | ❌ No                    |
| Different    | (none)                | no-cors                 | (!) Yes               | cors         | (default)          | No                    | cors                  | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | (none)                | no-cors                 | (!) Yes               | cors         | include            | Yes                   | cors                  | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | (none)                | no-cors                 | (!) Yes               | cors         | omit               | No                    | cors                  | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | use-credentials       | cors                    | Yes                   | no-cors      | (default)          | No                    | opaque                | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | use-credentials       | cors                    | Yes                   | no-cors      | include            | Yes                   | opaque                | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | use-credentials       | cors                    | Yes                   | no-cors      | omit               | No                    | opaque                | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | use-credentials       | cors                    | Yes                   | cors         | (default)          | No                    | cors                  | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | use-credentials       | cors                    | Yes                   | cors         | include            | Yes                   | cors                  | ✅ Yes                   | ✅ Yes                   | ✅ Yes                   |
| Different    | use-credentials       | cors                    | Yes                   | cors         | omit               | No                    | cors                  | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | anonymous             | cors                    | No                    | no-cors      | (default)          | No                    | opaque                | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | anonymous             | cors                    | No                    | no-cors      | include            | Yes                   | opaque                | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | anonymous             | cors                    | No                    | no-cors      | omit               | No                    | opaque                | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | anonymous             | cors                    | No                    | cors         | (default)          | No                    | cors                  | ✅ Yes                   | ✅ Yes                   | ✅ Yes                   |
| Different    | anonymous             | cors                    | No                    | cors         | include            | Yes                   | cors                  | ❌ No                    | ❌ No                    | ❌ No                    |
| Different    | anonymous             | cors                    | No                    | cors         | omit               | No                    | cors                  | ✅ Yes                   | ⚠️ No (same cookie&cors) | ✅ Yes                   |
| Any          | Any                   | -                       | -                     | same-origin  | Any                | -                     | -                     | ❌ No                    | ❌ No                    | ❌ No                    |

---

## Preload Reuse Experiment 2

In this experiment, we test if the browser reuses preloaded data when handling a `fetch()` which uses custom headers.

- Only `cors` mode is tested for `fetch()` because `no-cors` mode silently strips custom headers.
- The loaded URL is always cross-origin, since we are testing `cors` mode, and experiment 1 showed that preloaded 
data is reliably reused across browsers when the URL's effective origin, the presence of the `<link>` tag's `crossorigin` attribute, 
and the `fetch()` `mode` are consistent with each other.
- You can set and unset an optional query parameter `?cache=true` which makes the server return the header `Cache-Control: public, max-age=10`.

To run the servers for this experiment:

```sh
node preload-fetch-with-headers-html/index.js & node preload-fetch-with-headers-api/index.js
```

Source code: [`preload-fetch-with-headers-html/index.js`](preload-fetch-with-headers-html/index.js) and 
[`preload-fetch-with-headers-api/index.js`](preload-fetch-with-headers-api/index.js).

You can run the experiment yourself by visiting [https://html.local:3020/](https://html.local:3020/).

Since we cannot specify custom request headers when using `<link rel="preload" as="fetch">`, you would expect the following 
`fetch()` with custom headers to trigger a new request, but testing shows a more complicated picture.

The test results are as follows:

1. Chrome always reuses the preloaded data. If the preloading is in progress when the `fetch()` is triggered, 
Chrome waits for it to finish and reuses its response.
2. Firefox reuses preloaded data if it is cacheable. If the preloading is in progress when the `fetch()` is triggered, 
Firefox waits for it to finish.
   - If the preload response is cacheable, it is reused by the `fetch()` (finishing earlier than if we did a second request)
   - If the preload response is not cacheable, the browser sends a second separate request (finishing later than if the browser did not wait for the preloading)
3. Safari ignores the preload (whether finished or in progress) and sends a separate HTTP request for the `fetch()`

Safari's behavior is restrictive but always correct: a fetch with headers is never considered the same request as a preload 
without headers.

Chrome's behavior can lead to showing the wrong data if the server response is different based on the passed headers.

Firefox lets the server decide whether the response without headers is cached or not. Since Firefox relies on explicit 
server response headers, its reuse of preloads is less error-prone than Chrome's.
