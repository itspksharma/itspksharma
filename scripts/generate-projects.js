const fs = require("fs");
const https = require("https");

const username = "itspksharma";
const readmeFile = "README.md";
const startMarker = "<!-- PROJECTS:START -->";
const endMarker = "<!-- PROJECTS:END -->";

function fetchRepos() {
  return new Promise((resolve, reject) => {
    https.get(`https://api.github.com/users/${username}/repos`, {
      headers: { 'User-Agent': 'node.js' }
    }, res => {
      let data = '';
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

function formatProjects(repos) {
  const rows = repos
    .filter(repo => !repo.fork)
    .slice(0, 6) // Limit to top 6
    .map(repo => {
      return `| [${repo.name}](${repo.html_url}) | ${repo.description || "No description"} | ${repo.language || "N/A"} | [Repo](${repo.html_url}) |`;
    });

  return [
    "| Project | Description | Tech | Link |",
    "|---------|-------------|------|------|",
    ...rows
  ].join("\n");
}

(async () => {
  const repos = await fetchRepos();
  const projectSection = formatProjects(repos);

  let readme = fs.readFileSync(readmeFile, "utf-8");
  const newContent = `${startMarker}\n${projectSection}\n${endMarker}`;
  readme = readme.replace(new RegExp(`${startMarker}[\\s\\S]*${endMarker}`), newContent);
  fs.writeFileSync(readmeFile, readme);
})();
