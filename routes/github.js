
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
    console.log('Getting page 1...');
    const firstResponse = await callGitHubRepos(params);
    console.log(`GitHub requests left: ${firstResponse.headers['x-ratelimit-remaining']}/${firstResponse.headers['x-ratelimit-limit']}`);
    const lastPage = getLastPage(firstResponse.headers.link);
    console.log(`Total pages: ${lastPage}`);
    let otherResponses = [];
    for (let i = 2; i <= lastPage; i++) {
      console.log(`Getting page ${i}...`);
      params.querystring.page = i;
      const eachPageResponse = await callGitHubRepos(params);
      otherResponses.push(eachPageResponse.data);
    }
    otherResponses = otherResponses.flat();
    const data = [...firstResponse.data, ...otherResponses];
    const userResponses = [];
    console.log(`Getting data for ${data.length} users...`);
    for (const user of data) {
      userResponses.push(callGitHubUsers(user.login || user.owner.login));
    }
    let users = await Promise.all(userResponses);
    users = users.map(response => response.data)
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
    res.locals = { users, owner, repo, endpoint };
    console.log('Done');
    console.log(`GitHub requests left: ${firstResponse.headers['x-ratelimit-remaining']}/${firstResponse.headers['x-ratelimit-limit']}`);
    next();
  } catch (err) {
    return res.status(500).json(err.message);
  }
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

function getLastPage(headersLink) {
  if (!headersLink) {
    return 1;
  }
  const obj = {};
  // eg: headersLink = "<http...>; rel=last ..."
  headersLink = headersLink.split(', ').map(rel => rel.replace(/<|>|rel=|"/g, ''))
  headersLink.forEach(rel => {
    // "http; last"
    const [link, info] = rel.split('; ');
    // { last: link, ... }
    obj[info] = link;
  });
  return +obj.last.split('&page=')[1]; 
}

module.exports = main;
