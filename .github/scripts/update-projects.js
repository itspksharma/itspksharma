const fs = require("fs");
const axios = require("axios");

const username = "itspksharma"; // GitHub username
const token = process.env.GITHUB_TOKEN; // GitHub Secret
const readmePath = "README.md";

const startMarker = "<!-- PROJECTS:START -->";
const endMarker = "<!-- PROJECTS:END -->";

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
    const langs = Object.keys(response.data);
    return langs.length > 0 ? langs.join(", ") : null;
  } catch (err) {
    return null;
  }
}

// Format one row
function formatProject(repo, tech, star) {
  return `| ${star} | [${repo.name}](${repo.html_url}) | ${repo.description || "No description"} | ${tech} | [🔗 Visit](${repo.html_url}) |`;
}

(async () => {
  const repos = await getRepositories();
  const filteredRepos = [];

  for (const repo of repos) {
    if (repo.fork || repo.size === 0 || !repo.pushed_at) continue;

    const tech = await getLanguages(repo.name);
    if (!tech) continue;

    const star = repo.stargazers_count > 0 ? "⭐" : "";
    filteredRepos.push({ ...repo, tech, star });
  }

  filteredRepos.sort((a, b) => {
    if (b.stargazers_count !== a.stargazers_count) {
      return b.stargazers_count - a.stargazers_count;
    }
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

  const projectTable = [
    "## 🚀 Highlight Projects",
    "",
    "| ⭐ | Project | Description | Tech | Link |",
    "|----|---------|-------------|------|------|",
    ...filteredRepos.map(repo =>
      formatProject(repo, repo.tech, repo.star)
    ),
  ].join("\n");

  // Inject into README
  let readme = fs.readFileSync(readmePath, "utf8");
  const newSection = `${startMarker}\n${projectTable}\n${endMarker}`;

  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "gm");
  if (readme.match(regex)) {
    readme = readme.replace(regex, newSection);
  } else {
    readme += `\n\n${newSection}`;
  }

  fs.writeFileSync(readmePath, readme);
  console.log("✅ README.md updated with latest project list");
})();
