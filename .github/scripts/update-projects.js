const axios = require('axios');
const fs = require('fs');

const username = 'itspksharma';
const readmePath = 'README.md';

async function getRepos() {
  const response = await axios.get(`https://api.github.com/users/${username}/repos`);
  return response.data;
}

async function updateReadme() {
  const repos = await getRepos();

  const projectTable = [
    '## 🚀 Highlight Projects',
    '',
    '| ⭐ | Project | Description | Tech | Link |',
    '|----|---------|-------------|------|------|',
    ...repos
      .filter(repo =>
        !repo.fork &&
        repo.size > 0 &&
        repo.pushed_at
      )
      .sort((a, b) => {
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      })
      .map(repo => {
        const star = repo.stargazers_count > 0 ? '⭐' : '';
        const description = repo.description ? repo.description.replace(/\n/g, ' ') : 'No description';
        const tech = repo.language || 'N/A';
        const name = `[${repo.name}](${repo.html_url})`;

        return `| ${star} | ${name} | ${description} | ${tech} | 🔗 [Link](${repo.html_url}) |`;
      }),
    ''
  ].join('\n');

  const startMarker = '<!-- PROJECTS:START -->';
  const endMarker = '<!-- PROJECTS:END -->';

  let readme = fs.readFileSync(readmePath, 'utf8');

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
