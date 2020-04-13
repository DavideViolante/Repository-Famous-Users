
const axios = require('axios');

const githubApiUrl = 'https://api.github.com';
const authHeader = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`
};

async function main(req, res, next) {
  try {
    const { owner, repo, endpoint } = req.params;
    const validEndpoints = ['stargazers', 'subscribers', 'forks'];
    if (!validEndpoints.includes(endpoint)) {
      throw Error(`Invalid endpoint ${endpoint}, must be one of: ${validEndpoints}`);
    }
    const params = {
      owner, repo, endpoint,
      querystring: {
        per_page: 100,
        page: 1
      }
    }
    const firstResponse = await callGitHubRepos(params);
    const lastPage = getLastPage(firstResponse.headers.link);
    console.log(`GitHub requests before: ${firstResponse.headers['x-ratelimit-remaining']}/${firstResponse.headers['x-ratelimit-limit']}`);
    const promises = [];
    // Pages starts from 1, but we got it already
    for (let i = 2; i <= lastPage; i++) {
      params.querystring.page = i;
      promises.push(callGitHubRepos(params));
    }
    let otherResponses = await Promise.all(promises);
    otherResponses = otherResponses.map(response => response.data).flat();
    const data = clean([...firstResponse.data, ...otherResponses]);
    const userPromises = [];
    for (const user of data) {
      userPromises.push(callGitHubUsers(user.login || user.owner.login));
    }
    let userData = await Promise.all(userPromises);
    userData = userData.map(response => response.data)
      .map(user => ({
        id: user.id,
        username: user.login,
        avatar: user.avatar_url,
        bio: user.bio,
        location: user.location,
        company: (user.company || '').replace('@', ''),
        website: user.blog,
        followers: user.followers,
        repos: user.public_repos,
      }))
      .sort((a, b) => b.followers - a.followers);
    res.locals.data = userData;
    next();
  } catch (err) {
    return res.status(500).json(err.message);
  }
}

function clean(data) {
  return data
    // Remove null and undefined
    .filter(data => data)
    // Remove duplicates
    .filter((obj, i, self) => i === self.findIndex(item => item.login === obj.login));
}

function callGitHubUsers(username) {
  return axios({
    method: 'GET',
    headers: authHeader,
    url: `${githubApiUrl}/users/${username}`
  });
}

function callGitHubRepos(params) {
  return axios({
    method: 'GET',
    headers: authHeader,
    url: `${githubApiUrl}/repos/${params.owner}/${params.repo}/${params.endpoint}`,
    params: params.querystring
  });
}

function getLastPage(rels) {
  if (!rels) {
    return 1;
  }
  const obj = {};
  rels = rels.split(', ').map(rel => rel.replace(/<|>|rel=|"/g, ''))
  rels.forEach(rel => {
    const [link, info] = rel.split('; ');
    obj[info] = link;
  });
  return +obj.last.split('&page=')[1]; 
}

module.exports = main;
