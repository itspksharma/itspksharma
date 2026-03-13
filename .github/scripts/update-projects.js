const fs = require("fs");
const axios = require("axios");

const username = "itspksharma";
const token = process.env.GITHUB_TOKEN;
const readmePath = "README.md";

const startMarker = "<!-- PROJECTS:START -->";
const endMarker = "<!-- PROJECTS:END -->";

const hiddenRepo = "itspksharma"; // hide profile repo
const latestCount = 5;

// Fetch repositories
async function getRepositories() {
  const response = await axios.get(
    `https://api.github.com/users/${username}/repos?per_page=100`,
    {
      headers: { Authorization: `token ${token}` },
    }
  );

  return response.data;
}

// Get repo languages
async function getLanguages(repoName) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repoName}/languages`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );

    const langs = Object.keys(response.data).slice(0, 3);
    return langs.length ? langs.join(", ") : "Unknown";
  } catch {
    return "Unknown";
  }
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

// Format row
function formatRow(repo, tech) {
  return `| [${repo.name}](${repo.html_url}) | ${tech} | ${repo.description || "No description"} | ${formatDate(repo.pushed_at)} |`;
}

(async () => {
  const repos = await getRepositories();

  const filtered = repos.filter(
    (repo) =>
      !repo.fork &&
      repo.size > 0 &&
      repo.name !== hiddenRepo &&
      repo.pushed_at
  );

  // Sort by latest update
  filtered.sort(
    (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)
  );

  // Get tech stack
  const reposWithTech = await Promise.all(
    filtered.map(async (repo) => {
      const tech = await getLanguages(repo.name);
      return { ...repo, tech };
    })
  );

  const latestRepos = reposWithTech.slice(0, latestCount);
  const otherRepos = reposWithTech.slice(latestCount);

  const latestRows = latestRepos.map((r) => formatRow(r, r.tech));
  const otherRows = otherRepos.map((r) => formatRow(r, r.tech));

  const latestTable = [
    "## 🚀 Latest Projects",
    "",
    "| Project | Tech | Description | Updated |",
    "|--------|------|-------------|---------|",
    ...latestRows,
  ].join("\n");

  const otherTable = [
    "<details>",
    "<summary><b>📁 View All Other Projects</b></summary>\n",
    "",
    "| Project | Tech | Description | Updated |",
    "|--------|------|-------------|---------|",
    ...otherRows,
    "</details>",
  ].join("\n");

  const content = [latestTable, "", otherTable].join("\n");

  let readme = fs.readFileSync(readmePath, "utf8");

  const newSection = `${startMarker}\n${content}\n${endMarker}`;

  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "gm");

  if (readme.match(regex)) {
    readme = readme.replace(regex, newSection);
  } else {
    readme += `\n\n${newSection}`;
  }

  fs.writeFileSync(readmePath, readme);

  console.log("✅ README updated with latest projects");
})();
