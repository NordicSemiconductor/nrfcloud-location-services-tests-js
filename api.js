const https = require("https");
const { URL } = require("url");
const querystring = require("querystring");

const apiKey = process.env.API_KEY;
let apiHost = process.env.API_HOST;
if (apiHost === undefined || apiHost.length === 0)
  apiHost = "https://api.nrfcloud.com";

module.exports.post = (resource, payload) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(apiHost).hostname,
      port: 443,
      path: `/v1/${resource}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    };

    const req = https.request(options, (res) => {
      let response = [];

      res.on("data", (d) => {
        response.push(d.toString());
      });

      res.on("end", () => {
        console.debug(
          [
            `> POST https://${new URL(apiHost).hostname}/v1/${resource}`,
            `${JSON.stringify(payload)}`,
            "",
            `< ${res.statusCode} ${res.statusMessage}`,
            `${response.join("")}`,
          ].join("\n")
        );

        if (res.statusCode !== 200)
          return reject(new Error(`Request failed: ${res.statusCode}`));
        resolve(JSON.parse(response.join("")));
      });
    });
    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });

module.exports.get = (resource, payload, headers = {}) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(apiHost).hostname,
      port: 443,
      path: `/v1/${resource}?${querystring.stringify(payload)}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...headers,
      },
    };

    const req = https.get(options, (res) => {
      let response = [];

      res.on("data", (d) => {
        response.push(d.toString());
      });

      res.on("end", () => {
        const isJSON = res.headers["content-type"].includes("application/json");
        console.debug(
          [
            `> GET https://${
              new URL(apiHost).hostname
            }/v1/${resource}?${querystring.stringify(payload)}`,
            "",
            `< ${res.statusCode} ${res.statusMessage}`,
            `${isJSON ? response.join("") : "(binary data)"}`,
          ].join("\n")
        );

        if (res.statusCode > 399)
          return reject(new Error(`Request failed: ${res.statusCode}`));
        if (isJSON) return resolve(JSON.parse(response.join("")));
        return resolve(response.join(""));
      });
    });
    req.on("error", reject);
    req.end();
  });
