const fs = require("fs");
const axios = require("axios");

const username = "itspksharma"; // Change to your GitHub username
const token = process.env.GITHUB_TOKEN; // Set in GitHub secrets
const readmePath = "README.md";

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

// Get languages of a repository
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
    return Object.keys(response.data).join(", ") || "N/A";
  } catch (err) {
    return "N/A";
  }
}

// Format a single project row
function formatProject(repo, tech) {
  return `| [${repo.name}](${repo.html_url}) | ${repo.description || "No description"} | ${tech} | [🔗 Visit](${repo.html_url}) |`;
}

// Main logic
(async () => {
  const repos = await getRepositories();

  const filteredRepos = [];

  for (const repo of repos) {
    if (repo.fork || repo.size === 0) continue; // Ignore forks and empty repos

    const tech = await getLanguages(repo.name);
    if (tech === "N/A") continue; // Ignore repos with no tech/language

    filteredRepos.push({ ...repo, tech });
  }

  // Sort: Starred first, then recently updated
  filteredRepos.sort((a, b) => {
    if (a.stargazers_count === b.stargazers_count) {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }
    return b.stargazers_count - a.stargazers_count;
  });

  const projectTable = [
    "## 🚀 Highlight Projects",
    "",
    "| Project | Description | Tech | Link |",
    "|---------|-------------|------|------|",
    ...filteredRepos.map(repo => formatProject(repo, repo.tech)),
  ];

  const readme = fs.readFileSync(readmePath, "utf8");
  const newReadme = readme.replace(
    /## 🚀 Highlight Projects[\s\S]*?(?=\n## |$)/,
    projectTable.join("\n")
  );

  fs.writeFileSync(readmePath, newReadme);
})();
