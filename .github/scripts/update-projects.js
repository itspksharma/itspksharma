const axios = require('axios');
const fs = require('fs');

const username = 'itspksharma';
const readmePath = 'README.md';

async function getRepos() {
  const response = await axios.get(`https://api.github.com/users/${username}/repos`);
  return response.data;
}

function formatProject(repo) {
  return `| 🚀 ${repo.name} | ${repo.description || 'No description'} | ${repo.language || 'N/A'} | [Repo](${repo.html_url}) |`;
}

async function updateReadme() {
  const repos = await getRepos();

  const projectTable = [
    '## 🚀 Highlight Projects',
    '',
    '| Project | Description | Tech | Link |',
    '|---------|-------------|------|------|',
    ...repos
      .filter(repo => !repo.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map(formatProject),
    ''
  ].join('\n');

  let readme = fs.readFileSync(readmePath, 'utf8');

  const startMarker = '<!-- PROJECTS:START -->';
  const endMarker = '<!-- PROJECTS:END -->';

  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'gm');
  const newContent = `${startMarker}\n${projectTable}\n${endMarker}`;

  if (readme.match(regex)) {
    readme = readme.replace(regex, newContent);
  } else {
    readme += `\n\n${newContent}`;
  }

  fs.writeFileSync(readmePath, readme);
  console.log('✅ README.md updated with latest project list');
}

updateReadme().catch(err => {
  console.error('❌ Error updating README:', err.message);
});
