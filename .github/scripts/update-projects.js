const fs = require("fs");
const axios = require("axios");

const username = "itspksharma";
const token = process.env.GITHUB_TOKEN;
const readmePath = "README.md";

const startMarker = "<!-- PROJECTS:START -->";
const endMarker = "<!-- PROJECTS:END -->";
const pinnedRepoName = "portfolio"; // Always show this first

// Fetch repositories
async function getRepositories() {
  const perPage = 100;
  let page = 1;
  let allRepos = [];

  while (true) {
    const response = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );

    if (response.data.length === 0) break;
    allRepos = allRepos.concat(response.data);
    page++;
  }

  return allRepos;
}

// Get languages used in a repo
async function getLanguages(repoName) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repoName}/languages`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    const langs = Object.keys(response.data);
    return langs.length > 0 ? langs.join(", ") : null;
  } catch {
    return null;
  }
}

// Format a row
function formatProject(index, repo, tech) {
  return `| ${index} | [${repo.name}](${repo.html_url}) | ${repo.description || "No description"} | ${tech} | [🔗 Visit](${repo.html_url}) |`;
}

(async () => {
  const repos = await getRepositories();
  const filteredRepos = [];

  for (const repo of repos) {
    if (repo.fork || repo.size === 0 || !repo.pushed_at) continue;

    const tech = await getLanguages(repo.name);
    if (!tech) continue;

    filteredRepos.push({ ...repo, tech });
  }

  // Sort by stars then latest activity
  filteredRepos.sort((a, b) => {
    if (b.stargazers_count !== a.stargazers_count) {
      return b.stargazers_count - a.stargazers_count;
    }
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

  // Separate portfolio project
  const pinnedProject = filteredRepos.find(repo => repo.name.toLowerCase() === pinnedRepoName);
  const otherProjects = filteredRepos.filter(repo => repo.name.toLowerCase() !== pinnedRepoName);

  const pinnedTable = pinnedProject
    ? [
        "### 🎯 Featured Project: Portfolio",
        "",
        "| SL No. | Project | Description | Tech | Link |",
        "|--------|---------|-------------|------|------|",
        formatProject(1, pinnedProject, pinnedProject.tech),
      ].join("\n")
    : "";

  const otherTableRows = otherProjects.map((repo, index) =>
    formatProject(index + 2, repo, repo.tech) // start from 2 since 1 is for portfolio
  );

  const otherTable = [
    "<details>",
    "<summary><b>📁 Click to view all GitHub Projects</b></summary>\n",
    "| SL No. | Project | Description | Tech | Link |",
    "|--------|---------|-------------|------|------|",
    ...otherTableRows,
    "</details>"
  ].join("\n");

  const fullContent = [
    "## 🚀 Highlight Projects",
    "",
    pinnedTable,
    "",
    otherTable
  ].join("\n");

  // Inject into README
  let readme = fs.readFileSync(readmePath, "utf8");
  const newSection = `${startMarker}\n${fullContent}\n${endMarker}`;

  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "gm");
  if (readme.match(regex)) {
    readme = readme.replace(regex, newSection);
  } else {
    readme += `\n\n${newSection}`;
  }

  fs.writeFileSync(readmePath, readme);
  console.log("✅ README.md updated with serial-numbered, filtered & collapsible projects!");
})();
