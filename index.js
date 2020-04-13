const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
//const { mockdata, mockusers } = require('./data');

const githubApiUrl = 'https://api.github.com';
const owner = 'davideviolante';
const repo = 'gtav';
const params = {
  per_page: 100,
  page: 1
};
const authHeader = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`
};

async function main() {
  try {
    const endpoints = ['stargazers', 'subscribers', 'forks'];
    const firstResponse = await callGitHubRepos(endpoints[0], params);
    const lastPage = getLastPage(firstResponse.headers.link);
    const promises = [];
    // Pages starts from 1, but we got it already
    for (let i = 2; i <= lastPage; i++) {
      params.page = i;
      promises.push(callGitHubRepos(params));
    }
    let otherResponses = await Promise.all(promises);
    otherResponses = otherResponses.map(response => response.data);
    const data = [...firstResponse.data, ...otherResponses];
    //const data = mockdata;
    const userPromises = [];
    for (const user of data) {
      userPromises.push(getGitHubUserInfo(user.login));
    }
    let userData = await Promise.all(userPromises);
    userData = userData.map(response => response.data)
      .map(user => ({
        id: user.id,
        username: user.login,
        bio: user.bio,
        company: (user.company || '').replace('@', ''),
        repos: user.public_repos,
        followers: user.followers,
      }))
      .sort((a, b) => b.followers - a.followers);
    console.log(userData);
  } catch (err) {
    console.log(err);
  }
}

function getGitHubUserInfo(username) {
  return axios({
    method: 'GET',
    headers: authHeader,
    url: `${githubApiUrl}/users/${username}`
  });
}

function callGitHubRepos(endpoint, params) {
  return axios({
    method: 'GET',
    headers: authHeader,
    url: `${githubApiUrl}/repos/${owner}/${repo}/${endpoint}`,
    params: params
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

main();
